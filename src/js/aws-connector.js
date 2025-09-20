/**
 * AWS Connector
 * Integration with Amazon Web Services APIs for cloud resource management
 */

import { BaseConnector } from './enterprise-api-framework.js';

class AWSConnector extends BaseConnector {
    constructor(config) {
        super(config);
        
        // Required config: accessKeyId, secretAccessKey, region
        if (!config.accessKeyId || !config.secretAccessKey || !config.region) {
            throw new Error('AWS requires accessKeyId, secretAccessKey, and region in config');
        }
        
        this.region = config.region;
        this.sessionToken = config.sessionToken || null;
        this.baseUrl = `https://${this.region}.amazonaws.com`;
        
        // Service endpoints
        this.endpoints = {
            ec2: `https://ec2.${this.region}.amazonaws.com`,
            s3: `https://s3.${this.region}.amazonaws.com`,
            rds: `https://rds.${this.region}.amazonaws.com`,
            lambda: `https://lambda.${this.region}.amazonaws.com`,
            ecs: `https://ecs.${this.region}.amazonaws.com`,
            cloudformation: `https://cloudformation.${this.region}.amazonaws.com`,
            cloudwatch: `https://monitoring.${this.region}.amazonaws.com`,
            iam: 'https://iam.amazonaws.com', // IAM is global
            route53: 'https://route53.amazonaws.com', // Route53 is global
            sns: `https://sns.${this.region}.amazonaws.com`,
            sqs: `https://sqs.${this.region}.amazonaws.com`
        };
    }

    /**
     * AWS Signature Version 4 signing
     */
    async createSignature(method, service, path, queryParams = {}, headers = {}, body = '') {
        const now = new Date();
        const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
        
        // Canonical request components
        const canonicalUri = path;
        const canonicalQueryString = Object.keys(queryParams)
            .sort()
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
            .join('&');
        
        const canonicalHeaders = Object.keys(headers)
            .sort()
            .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
            .join('');
        
        const signedHeaders = Object.keys(headers)
            .sort()
            .map(key => key.toLowerCase())
            .join(';');
        
        const payloadHash = await this.sha256(body);
        
        const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
        
        // String to sign
        const algorithm = 'AWS4-HMAC-SHA256';
        const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
        const stringToSign = `${algorithm}\n${timeStamp}\n${credentialScope}\n${await this.sha256(canonicalRequest)}`;
        
        // Calculate signature
        const signingKey = await this.getSignatureKey(this.config.secretAccessKey, dateStamp, this.region, service);
        const signature = await this.hmacSha256(signingKey, stringToSign, 'hex');
        
        // Authorization header
        const authorization = `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
        
        return {
            authorization,
            timestamp: timeStamp,
            headers: {
                ...headers,
                'Authorization': authorization,
                'X-Amz-Date': timeStamp
            }
        };
    }

    async getSignatureKey(key, dateStamp, regionName, serviceName) {
        const kDate = await this.hmacSha256(`AWS4${key}`, dateStamp);
        const kRegion = await this.hmacSha256(kDate, regionName);
        const kService = await this.hmacSha256(kRegion, serviceName);
        const kSigning = await this.hmacSha256(kService, 'aws4_request');
        return kSigning;
    }

    async sha256(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async hmacSha256(key, message, outputFormat = 'buffer') {
        const encoder = new TextEncoder();
        
        let keyBuffer;
        if (typeof key === 'string') {
            keyBuffer = encoder.encode(key);
        } else {
            keyBuffer = key;
        }
        
        const messageBuffer = encoder.encode(message);
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
        
        if (outputFormat === 'hex') {
            const hashArray = Array.from(new Uint8Array(signature));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        return new Uint8Array(signature);
    }

    /**
     * Authenticate with AWS
     */
    async authenticate() {
        try {
            // Test authentication by making a simple STS call
            const identity = await this.getCallerIdentity();
            
            this.authenticated = true;
            this.lastAuthTime = Date.now();

            return {
                userId: identity.UserId,
                account: identity.Account,
                arn: identity.Arn,
                region: this.region,
                timestamp: this.lastAuthTime
            };

        } catch (error) {
            this.authenticated = false;
            throw new Error(`AWS authentication failed: ${error.message}`);
        }
    }

    /**
     * Make signed requests to AWS APIs
     */
    async request(service, path, options = {}) {
        if (!this.authenticated) {
            await this.authenticate();
        }

        const method = options.method || 'GET';
        const queryParams = options.queryParams || {};
        const body = options.body || '';
        const customHeaders = options.headers || {};
        
        const endpoint = this.endpoints[service] || `https://${service}.${this.region}.amazonaws.com`;
        const url = `${endpoint}${path}`;
        
        // Standard headers
        const headers = {
            'Host': new URL(url).host,
            'Content-Type': 'application/x-amz-json-1.1',
            ...customHeaders
        };
        
        if (this.sessionToken) {
            headers['X-Amz-Security-Token'] = this.sessionToken;
        }

        // Create signature
        const signature = await this.createSignature(method, service, path, queryParams, headers, body);
        
        const requestOptions = {
            method,
            headers: signature.headers,
            ...options
        };
        
        if (body && method !== 'GET') {
            requestOptions.body = body;
        }

        const fullUrl = Object.keys(queryParams).length > 0 
            ? `${url}?${Object.keys(queryParams).map(k => `${k}=${encodeURIComponent(queryParams[k])}`).join('&')}`
            : url;

        return await this.makeHttpRequest(fullUrl, requestOptions);
    }

    /**
     * STS (Security Token Service) Operations
     */
    async getCallerIdentity() {
        return await this.request('sts', '/', {
            method: 'POST',
            headers: {
                'X-Amz-Target': 'AWSSecurityTokenServiceV20110615.GetCallerIdentity'
            },
            body: '{}'
        });
    }

    async assumeRole(roleArn, roleSessionName, options = {}) {
        const params = {
            RoleArn: roleArn,
            RoleSessionName: roleSessionName,
            ...options
        };

        return await this.request('sts', '/', {
            method: 'POST',
            headers: {
                'X-Amz-Target': 'AWSSecurityTokenServiceV20110615.AssumeRole'
            },
            body: JSON.stringify(params)
        });
    }

    /**
     * EC2 Operations
     */
    async getEC2Instances(options = {}) {
        const params = {
            Action: 'DescribeInstances',
            Version: '2016-11-15',
            ...options
        };

        return await this.request('ec2', '/', {
            method: 'POST',
            queryParams: params
        });
    }

    async startEC2Instance(instanceId) {
        return await this.request('ec2', '/', {
            method: 'POST',
            queryParams: {
                Action: 'StartInstances',
                Version: '2016-11-15',
                'InstanceId.1': instanceId
            }
        });
    }

    async stopEC2Instance(instanceId) {
        return await this.request('ec2', '/', {
            method: 'POST',
            queryParams: {
                Action: 'StopInstances',
                Version: '2016-11-15',
                'InstanceId.1': instanceId
            }
        });
    }

    async terminateEC2Instance(instanceId) {
        return await this.request('ec2', '/', {
            method: 'POST',
            queryParams: {
                Action: 'TerminateInstances',
                Version: '2016-11-15',
                'InstanceId.1': instanceId
            }
        });
    }

    async getEC2SecurityGroups() {
        return await this.request('ec2', '/', {
            method: 'POST',
            queryParams: {
                Action: 'DescribeSecurityGroups',
                Version: '2016-11-15'
            }
        });
    }

    async getEC2KeyPairs() {
        return await this.request('ec2', '/', {
            method: 'POST',
            queryParams: {
                Action: 'DescribeKeyPairs',
                Version: '2016-11-15'
            }
        });
    }

    /**
     * S3 Operations
     */
    async getS3Buckets() {
        return await this.request('s3', '/', {
            method: 'GET'
        });
    }

    async getS3Objects(bucketName, options = {}) {
        const queryParams = {};
        if (options.prefix) queryParams.prefix = options.prefix;
        if (options.maxKeys) queryParams['max-keys'] = options.maxKeys;
        if (options.marker) queryParams.marker = options.marker;

        return await this.request('s3', `/${bucketName}`, {
            method: 'GET',
            queryParams
        });
    }

    async getS3Object(bucketName, key) {
        return await this.request('s3', `/${bucketName}/${key}`, {
            method: 'GET'
        });
    }

    async putS3Object(bucketName, key, body, options = {}) {
        return await this.request('s3', `/${bucketName}/${key}`, {
            method: 'PUT',
            body,
            headers: {
                'Content-Type': options.contentType || 'application/octet-stream',
                ...options.headers
            }
        });
    }

    async deleteS3Object(bucketName, key) {
        return await this.request('s3', `/${bucketName}/${key}`, {
            method: 'DELETE'
        });
    }

    /**
     * Lambda Operations
     */
    async getLambdaFunctions(options = {}) {
        const queryParams = {};
        if (options.maxItems) queryParams.MaxItems = options.maxItems;
        if (options.marker) queryParams.Marker = options.marker;

        return await this.request('lambda', '/2015-03-31/functions', {
            method: 'GET',
            queryParams
        });
    }

    async getLambdaFunction(functionName) {
        return await this.request('lambda', `/2015-03-31/functions/${functionName}`, {
            method: 'GET'
        });
    }

    async invokeLambdaFunction(functionName, payload, options = {}) {
        const headers = {
            'X-Amz-Invocation-Type': options.invocationType || 'RequestResponse'
        };

        if (options.logType) {
            headers['X-Amz-Log-Type'] = options.logType;
        }

        return await this.request('lambda', `/2015-03-31/functions/${functionName}/invocations`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
    }

    async updateLambdaFunctionCode(functionName, code) {
        return await this.request('lambda', `/2015-03-31/functions/${functionName}/code`, {
            method: 'PUT',
            body: JSON.stringify(code)
        });
    }

    /**
     * RDS Operations
     */
    async getRDSInstances() {
        return await this.request('rds', '/', {
            method: 'POST',
            queryParams: {
                Action: 'DescribeDBInstances',
                Version: '2014-10-31'
            }
        });
    }

    async getRDSClusters() {
        return await this.request('rds', '/', {
            method: 'POST',
            queryParams: {
                Action: 'DescribeDBClusters',
                Version: '2014-10-31'
            }
        });
    }

    async startRDSInstance(instanceId) {
        return await this.request('rds', '/', {
            method: 'POST',
            queryParams: {
                Action: 'StartDBInstance',
                Version: '2014-10-31',
                DBInstanceIdentifier: instanceId
            }
        });
    }

    async stopRDSInstance(instanceId) {
        return await this.request('rds', '/', {
            method: 'POST',
            queryParams: {
                Action: 'StopDBInstance',
                Version: '2014-10-31',
                DBInstanceIdentifier: instanceId
            }
        });
    }

    /**
     * CloudWatch Operations
     */
    async getCloudWatchMetrics(options = {}) {
        const params = {
            Action: 'ListMetrics',
            Version: '2010-08-01',
            ...options
        };

        return await this.request('cloudwatch', '/', {
            method: 'POST',
            queryParams: params
        });
    }

    async getCloudWatchMetricStatistics(metricName, namespace, startTime, endTime, period, statistics) {
        return await this.request('cloudwatch', '/', {
            method: 'POST',
            queryParams: {
                Action: 'GetMetricStatistics',
                Version: '2010-08-01',
                MetricName: metricName,
                Namespace: namespace,
                StartTime: startTime,
                EndTime: endTime,
                Period: period,
                'Statistics.member.1': statistics
            }
        });
    }

    async putCloudWatchMetricData(namespace, metricData) {
        return await this.request('cloudwatch', '/', {
            method: 'POST',
            queryParams: {
                Action: 'PutMetricData',
                Version: '2010-08-01',
                Namespace: namespace,
                ...metricData
            }
        });
    }

    /**
     * IAM Operations
     */
    async getIAMUsers() {
        return await this.request('iam', '/', {
            method: 'POST',
            queryParams: {
                Action: 'ListUsers',
                Version: '2010-05-08'
            }
        });
    }

    async getIAMRoles() {
        return await this.request('iam', '/', {
            method: 'POST',
            queryParams: {
                Action: 'ListRoles',
                Version: '2010-05-08'
            }
        });
    }

    async getIAMPolicies() {
        return await this.request('iam', '/', {
            method: 'POST',
            queryParams: {
                Action: 'ListPolicies',
                Version: '2010-05-08'
            }
        });
    }

    /**
     * CloudFormation Operations
     */
    async getCloudFormationStacks() {
        return await this.request('cloudformation', '/', {
            method: 'POST',
            queryParams: {
                Action: 'DescribeStacks',
                Version: '2010-05-15'
            }
        });
    }

    async getCloudFormationStack(stackName) {
        return await this.request('cloudformation', '/', {
            method: 'POST',
            queryParams: {
                Action: 'DescribeStacks',
                Version: '2010-05-15',
                StackName: stackName
            }
        });
    }

    async createCloudFormationStack(stackName, templateBody, parameters = {}) {
        const params = {
            Action: 'CreateStack',
            Version: '2010-05-15',
            StackName: stackName,
            TemplateBody: templateBody
        };

        // Add parameters
        Object.entries(parameters).forEach(([key, value], index) => {
            params[`Parameters.member.${index + 1}.ParameterKey`] = key;
            params[`Parameters.member.${index + 1}.ParameterValue`] = value;
        });

        return await this.request('cloudformation', '/', {
            method: 'POST',
            queryParams: params
        });
    }

    async deleteCloudFormationStack(stackName) {
        return await this.request('cloudformation', '/', {
            method: 'POST',
            queryParams: {
                Action: 'DeleteStack',
                Version: '2010-05-15',
                StackName: stackName
            }
        });
    }

    /**
     * Statistics and Monitoring
     */
    async getAWSResourceSummary() {
        try {
            const [ec2, s3, lambda, rds] = await Promise.allSettled([
                this.getEC2Instances(),
                this.getS3Buckets(),
                this.getLambdaFunctions(),
                this.getRDSInstances()
            ]);

            return {
                ec2: {
                    status: ec2.status,
                    instances: ec2.status === 'fulfilled' ? (ec2.value.Reservations?.length || 0) : 0,
                    error: ec2.status === 'rejected' ? ec2.reason.message : null
                },
                s3: {
                    status: s3.status,
                    buckets: s3.status === 'fulfilled' ? (s3.value.Buckets?.length || 0) : 0,
                    error: s3.status === 'rejected' ? s3.reason.message : null
                },
                lambda: {
                    status: lambda.status,
                    functions: lambda.status === 'fulfilled' ? (lambda.value.Functions?.length || 0) : 0,
                    error: lambda.status === 'rejected' ? lambda.reason.message : null
                },
                rds: {
                    status: rds.status,
                    instances: rds.status === 'fulfilled' ? (rds.value.DBInstances?.length || 0) : 0,
                    error: rds.status === 'rejected' ? rds.reason.message : null
                },
                region: this.region,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to get AWS resource summary: ${error.message}`);
        }
    }

    /**
     * Health check implementation
     */
    async healthCheck() {
        try {
            const identity = await this.getCallerIdentity();
            return {
                status: 'healthy',
                account: identity.Account,
                region: this.region,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get connector information
     */
    getInfo() {
        return {
            name: 'AWS',
            region: this.region,
            authenticated: this.authenticated,
            lastAuth: this.lastAuthTime ? new Date(this.lastAuthTime).toISOString() : null,
            hasSessionToken: !!this.sessionToken
        };
    }
}

// Export for use in other modules
window.AWSConnector = AWSConnector;
export default AWSConnector;