export default {
  async fetch(request, env) {
    const GITHUB_REPO_API = "https://api.github.com/repos/Hiplitehehe/Bhhhhh/contents/Jnnbb";
    const GITHUB_TOKEN = env.GITHUB_TOKEN; // Retrieve GitHub token from environment variables
    const USER_AGENT = "CloudflareWorker/1.0 (+https://hiplitehehe.workers.dev)"; // Custom user-agent

    if (request.method === "POST") {
      try {
        // Read raw request body
        const rawBody = await request.text();
        console.log("Raw Body Received:", rawBody);  // Log the raw body to debug
        
        // Parse the body as JSON
        const body = JSON.parse(rawBody);
        
        // Check if 'type' field is present
        if (!body.type) {
          return new Response(
            JSON.stringify({ error: "'type' field is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Retrieve the current file content (and its SHA) from GitHub
        const sha = await getFileSHA(GITHUB_REPO_API, GITHUB_TOKEN, USER_AGENT);
        
        // If no file exists, return an error
        if (sha === null) {
          return new Response(
            JSON.stringify({ error: "File not found on GitHub" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // Fetch the current content of the file
        const fileResponse = await fetch(GITHUB_REPO_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": USER_AGENT,
          },
        });

        const fileData = await fileResponse.json();
        const existingContent = JSON.parse(atob(fileData.content)); // Decode base64 content

        // Ensure existingContent is an array, if not, initialize it as an empty array
        const typesList = Array.isArray(existingContent.types) ? existingContent.types : [];

        // Add the new 'type' to the list
        typesList.push(body.type);

        // Encode the updated content back to base64
        const updatedContent = JSON.stringify({ types: typesList }, null, 2);

        // Update the GitHub file with the new data
        const updateResponse = await fetch(GITHUB_REPO_API, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "User-Agent": USER_AGENT,
          },
          body: JSON.stringify({
            message: "Update types list",
            content: btoa(updatedContent),  // Encode content as base64
            sha: sha,  // Use the file's SHA to update the content
          }),
        });

        const responseBody = await updateResponse.json();

        // Check if the update was successful
        if (!updateResponse.ok) {
          console.error("GitHub API Error:", responseBody);
          return new Response(
            JSON.stringify({ error: "Failed to update file", details: responseBody }),
            { status: updateResponse.status, headers: { "Content-Type": "application/json" } }
          );
        }

        // Return success response
        return new Response(
          JSON.stringify({ message: "Type has been added", types: typesList }),
          { headers: { "Content-Type": "application/json" } }
        );
        
      } catch (err) {
        console.error("Error Processing Request:", err.message);
        return new Response(
          JSON.stringify({ error: "Invalid request", details: err.message }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Handle GET requests
    if (request.method === "GET") {
      try {
        // Fetch the file content from GitHub
        const fileResponse = await fetch(GITHUB_REPO_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": USER_AGENT,
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
        const content = JSON.parse(atob(fileData.content)); // Decode base64 content

        // Return the list of types stored
        return new Response(
          JSON.stringify({ message: "The stored types are", types: content.types }),
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

    // Handle unsupported methods
    return new Response(
      JSON.stringify({ error: "Only POST and GET methods are allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  },
};

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
