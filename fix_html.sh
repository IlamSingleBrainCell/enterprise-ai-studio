#!/bin/bash
# Script to fix the HTML file by removing the broken ending and adding clean tags

# Get the working part (up to line 3221)
head -n 3221 "c:/YOKA/macquarie_poc/index.html" > "c:/YOKA/macquarie_poc/temp.html"

# Add proper closing tags
echo "</body>" >> "c:/YOKA/macquarie_poc/temp.html"
echo "</html>" >> "c:/YOKA/macquarie_poc/temp.html"

# Replace the original file
mv "c:/YOKA/macquarie_poc/temp.html" "c:/YOKA/macquarie_poc/index.html"