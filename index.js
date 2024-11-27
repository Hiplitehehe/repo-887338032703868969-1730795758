const GITHUB_API_URL = "https://api.github.com";
const GITHUB_REPO = "Hiplitehehe/Bhhhhh"; // Replace with your repo
const GITHUB_FILE_PATH = "Jnnbb"; // File path in the repo

async function handleRequest(request, env) {
  if (request.method === "POST") {
    const data = await request.json();
    const newThing = data.thing;

    if (!newThing) {
      return new Response(JSON.stringify({ error: "No thing provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the existing file from GitHub
    const fileResponse = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`, // Use the environment variable
        Accept: "application/vnd.github.v3+json",
      },
    });

    let existingContent = [];
    let sha = null;

    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha; // File's SHA needed to update it
      existingContent = fileData.content ? JSON.parse(atob(fileData.content)) : [];
    }

    // Add the new thing
    existingContent.push(newThing);

    // Encode the updated content in base64
    const updatedContent = btoa(JSON.stringify(existingContent, null, 2));

    // Update the file in GitHub
    const updateResponse = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`, // Use the environment variable
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `Add new thing: ${newThing}`,
        content: updatedContent,
        sha: sha, // Include SHA to update the existing file
      }),
    });

    if (updateResponse.ok) {
      return new Response(JSON.stringify({ message: "Thing added successfully!" }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Failed to update file in GitHub" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, ENV));
});
