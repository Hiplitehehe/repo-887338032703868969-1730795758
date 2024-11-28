export default {
  async fetch(request, env) {
    const GITHUB_REPO_API = "https://api.github.com/repos/Hiplitehehe/Bhhhhh/contents/Jnnbb"; // Fixed file extension
    const GITHUB_TOKEN = env.GITHUB_TOKEN; // Retrieve GitHub token from environment variables
    const USER_AGENT = "CloudflareWorker/1.0 (+https://hiplitehehe.workers.dev)"; // Custom user-agent

    if (request.method === "POST") {
      try {
        const rawBody = await request.text();
        console.log("Raw Body Received:", rawBody);

        const body = JSON.parse(rawBody);
        if (!body.type) {
          return new Response(
            JSON.stringify({ error: "'type' field is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Get existing file content and merge with new data
        const fileContent = await getFileContent(GITHUB_REPO_API, GITHUB_TOKEN, USER_AGENT);
        const updatedContent = { 
          ...fileContent, // Retain existing content
          type: body.type, // Update or add the type field
        };

        const sha = await getFileSHA(GITHUB_REPO_API, GITHUB_TOKEN, USER_AGENT);

        const fileResponse = await fetch(GITHUB_REPO_API, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "User-Agent": USER_AGENT, // Include custom user-agent
          },
          body: JSON.stringify({
            message: "Update type value",
            content: btoa(JSON.stringify(updatedContent, null, 2)),  // Encode updated content in base64
            sha: sha || undefined,
          }),
        });

        const responseBody = await fileResponse.json();
        if (!fileResponse.ok) {
          console.error("GitHub API Error:", responseBody);
          return new Response(
            JSON.stringify({ error: "Failed to update file", details: responseBody }),
            { status: fileResponse.status, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ message: "Type has been stored", type: body.type }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("Error Parsing JSON:", err.message);
        return new Response(
          JSON.stringify({ error: "Invalid request", details: err.message }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (request.method === "GET") {
      try {
        const fileResponse = await fetch(GITHUB_REPO_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": USER_AGENT, // Include custom user-agent
          },
        });

        const contentType = fileResponse.headers.get("content-type");
        if (!fileResponse.ok || !contentType.includes("application/json")) {
          const errorText = await fileResponse.text();
          console.error("GitHub API Non-JSON Response:", errorText);
          return new Response(
            JSON.stringify({
              error: "File not found or could not be retrieved",
              details: errorText,
            }),
            { status: fileResponse.status, headers: { "Content-Type": "application/json" } }
          );
        }

        const fileData = await fileResponse.json();
        const content = JSON.parse(atob(fileData.content));  // Decode the base64 content
        return new Response(
          JSON.stringify({ message: "The stored type is", type: content.type }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("Error Retrieving File:", err.message);
        return new Response(
          JSON.stringify({ error: "Failed to retrieve file", details: err.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Only POST and GET methods are allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  },
};

// Helper function to get the current file content
async function getFileContent(GITHUB_REPO_API, GITHUB_TOKEN, USER_AGENT) {
  const response = await fetch(GITHUB_REPO_API, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": USER_AGENT, // Include custom user-agent
    },
  });

  if (response.ok) {
    const data = await response.json();
    const content = JSON.parse(atob(data.content)); // Decode the base64 content
    return content;
  }
  return {}; // Return an empty object if the file does not exist
}

// Helper function to get the file SHA for updates
async function getFileSHA(GITHUB_REPO_API, GITHUB_TOKEN, USER_AGENT) {
  const response = await fetch(GITHUB_REPO_API, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": USER_AGENT, // Include custom user-agent
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data.sha;
  }
  return null;
}
