# Multi-Phi4 Deployment & Streaming

## Overview
This document explains how to run dedicated Phi-4 model service instances per agent type and enable real-time streaming responses.

## 1. Enable Dedicated Phi-4 Instances
Uncomment the desired phi4 service blocks in `docker-compose.microservices.yml` (e.g. `product-manager-phi4`, `business-analyst-phi4`, etc.). Keep in mind each instance loads the model (GPU/CPU memory intensive).

## 2. Map Agents to Instances
Uncomment and set the corresponding environment variables in `agent-orchestrator` service:
```
PRODUCT_MANAGER_PHI4_URL=http://product-manager-phi4:8001
BUSINESS_ANALYST_PHI4_URL=http://business-analyst-phi4:8001
SOFTWARE_DEVELOPER_PHI4_URL=http://software-developer-phi4:8001
QA_ENGINEER_PHI4_URL=http://qa-engineer-phi4:8001
DEVOPS_ENGINEER_PHI4_URL=http://devops-engineer-phi4:8001
```
If a variable is not set, that agent falls back to `AI_SERVICE_URL`.

## 3. Build & Start
For a selective bring-up (example enabling product manager + developer):
```powershell
# Build images
docker compose -f docker-compose.microservices.yml build product-manager-phi4 software-developer-phi4 agent-orchestrator

# Start required services
docker compose -f docker-compose.microservices.yml up -d redis agent-orchestrator product-manager-phi4 software-developer-phi4 api-gateway frontend
```

## 4. Verify Per-Agent Routing
```powershell
# Product Manager task (hits product-manager-phi4)
curl -X POST http://localhost:8002/workflow/create -H "Content-Type: application/json" -d @workflow.json
```
Inspect logs:
```powershell
docker logs -f product_manager_phi4
```
You should see only product manager prompts.

## 5. Streaming Endpoint
Each Phi4 instance exposes `/agent/stream` (Server-Sent Events). Example:
```powershell
curl -N -X POST http://localhost:8101/agent/stream -H "Content-Type: application/json" -d '{"agent_type":"product_manager","task":"Create roadmap","context":{}}'
```
You will receive `data: {"token":...,"text":...}` lines until a final event containing `{"final": true}`.

### 5.1 Gateway Streaming Proxy
Instead of calling the service container directly, you can now POST to the gateway:
```
POST http://localhost:8080/api/v1/ai/stream
Body: {"agent_type":"product_manager","task":"Create roadmap"}
```
Returns SSE (`text/event-stream`).

PowerShell test:
```powershell
curl -N -X POST http://localhost:8080/api/v1/ai/stream `
	-H "Content-Type: application/json" `
	-d '{"agent_type":"software_developer","task":"Outline service architecture"}'
```

### 5.2 WebSocket Streaming
Gateway WebSocket endpoint: `ws://localhost:8080/ws/ai/stream`

Client sends initial JSON message (one per generation):
```json
{
	"agent_type": "qa_engineer",
	"task": "Design performance test plan",
	"context": {}
}
```
Server pushes incremental JSON token payloads (same structure as SSE `data:` lines).

Browser example:
```javascript
const ws = new WebSocket('ws://localhost:8080/ws/ai/stream');
ws.onopen = () => ws.send(JSON.stringify({
	agent_type: 'devops_engineer',
	task: 'Design CI/CD pipeline for microservices',
	context: {}
}));
ws.onmessage = (ev) => {
	const payload = JSON.parse(ev.data);
	if (payload.final) {
		console.log('Final text:', payload.text);
	} else if (payload.token) {
		// append token chunk to UI
	} else if (payload.error) {
		console.error('Error', payload.error);
	}
};
```

## 6. Integrating Streaming in Frontend / Orchestrator
You can point a frontend EventSource to a dedicated service:
```javascript
const es = new EventSource("/agent/stream"); // if proxied
```
(If not yet proxied via gateway, call the service container port directly.)

## 7. Resource Considerations
- Each 4-bit quantized instance still consumes GPU VRAM; stagger startup.
- Start with one shared instance; scale out only for heavy parallel workflows.
- Monitor `/health` for memory metrics.

## 8. Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| 503 Model not loaded | Still downloading / initializing | Wait, check logs `docker logs <container>` |
| Slow startup | Cache miss | Keep `phi4_cache` volume mounted |
| OOM / killed | Too many concurrent instances | Reduce number, increase memory/GPU |
| No streaming tokens | SSE blocked by proxy | Ensure gateway/nginx allows `text/event-stream` |

## 9. Next Steps
- Add gateway proxy route for `/agent/stream` per agent.
- Implement token usage accounting.
- Add cancellation endpoint (track generation task IDs).

## 10. Cancellation & Token Usage (Implemented)
### Cancellation
1. Start a streaming request and capture `X-Generation-ID` response header (gateway will forward soon if added) or the `generation_id` included in final SSE/WebSocket payload.
2. Cancel in-flight generation:
```powershell
curl -X POST http://localhost:8001/agent/cancel/<GEN_ID>
```
3. Stream will emit: `data: {"cancelled": true, "generation_id": "<GEN_ID>"}` then stop.

### Token Accounting
Final SSE/WebSocket message now includes:
```json
{
	"final": true,
	"text": "...",
	"usage": {
		"prompt_tokens": 123,
		"completion_tokens": 456,
		"total_tokens": 579
	},
	"generation_id": "<GEN_ID>"
}
```
Synchronous `/agent/generate` also returns a `usage` object.

---
Maintained by: Enterprise AI Studio Team
