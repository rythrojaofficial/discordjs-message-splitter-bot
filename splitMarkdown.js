const safeCharacterLimit = 1850;


export async function runChunking(text){
    const chunks =  splitMarkdown(text)
    return chunks;
}

function splitMarkdown(text, chunkSize = safeCharacterLimit) {
    text = text.replace(/\uFFFC/g, '');
    const lines = text.split("\n");
    const chunks = [];
    let currentChunk = "";
    let currentBlock = "";
    let insideCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // More precise fence detection: exactly ``` (with optional language) at start of line
        const trimmedLine = line.trim();
        const isFence = trimmedLine.startsWith("```") && 
                        (trimmedLine === "```" || trimmedLine.match(/^```[a-zA-Z0-9-]*$/));
        
        // Add the line to current block first
        currentBlock += line + "\n";
        
        // Then toggle the code block state if it's a fence
        if (isFence) {
            insideCodeBlock = !insideCodeBlock;
        }

        const nextLine = lines[i + 1] || "";
        const isNextBlockBoundary = !insideCodeBlock && 
                                   (nextLine.trim() === "" || i === lines.length - 1);

        if (isNextBlockBoundary || i === lines.length - 1) {
            const blockWithSpacing = currentBlock + (i === lines.length - 1 ? "" : "\n");
            
            if (blockWithSpacing.length > chunkSize) {
                const subChunks = splitLongBlock(blockWithSpacing, chunkSize);
                for (const subChunk of subChunks) {
                    if (currentChunk.length + subChunk.length <= chunkSize) {
                        currentChunk += subChunk;
                    } else {
                        if (currentChunk) chunks.push(currentChunk.trim());
                        currentChunk = subChunk;
                    }
                }
            } else if (currentChunk.length + blockWithSpacing.length <= chunkSize) {
                currentChunk += blockWithSpacing;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = blockWithSpacing;
            }
            currentBlock = "";
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    const total = chunks.length;
    return chunks.map((chunk, i) => `\n\n${chunk}`);
}

function splitLongBlock(text, maxLength) {
    const result = [];
    let remaining = text;

    while (remaining.length > maxLength) {
        let splitPoint = remaining.lastIndexOf("\n", maxLength);
        if (splitPoint === -1 || splitPoint < maxLength * 0.5) {
            splitPoint = maxLength;
        }
        result.push(remaining.slice(0, splitPoint).trim() + "\n");
        remaining = remaining.slice(splitPoint).trimStart();
    }

    if (remaining) result.push(remaining);
    return result;
}