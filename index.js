const THINGS_NAMESPACE = 'things'; // Define the KV namespace

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    // Retrieve and return the list of added things from KV
    const things = await THINGS_NAMESPACE.list();
    return new Response(JSON.stringify(things.keys), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else if (request.method === 'POST') {
    const formData = await request.json();
    const newThing = formData.thing;

    if (newThing) {
      // Store the new thing in KV
      const thingId = `thing-${Date.now()}`; // Generate a unique key
      await THINGS_NAMESPACE.put(thingId, newThing);
      return new Response(JSON.stringify({ message: "Thing added!" }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: "No thing provided" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
