/**
 * Cloudflare Worker for Telegram Bot
 * This worker handles incoming webhook requests from Telegram
 */

// Configuration (set these in your Cloudflare Worker environment variables)
const BOT_TOKEN = ""; // You'll set this in Cloudflare Worker environment variables

// Main event listener for incoming requests
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handle incoming requests
 * @param {Request} request - The incoming request object
 */
async function handleRequest(request) {
  // Parse the URL to get pathname
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle webhook requests from Telegram
  if (path === "/webhook" && request.method === "POST") {
    return handleWebhook(request);
  }

  // Health check endpoint
  if (path === "/health" || path === "/api/health") {
    return new Response(
      JSON.stringify({
        status: "ok",
        bot_running: true,
        bot_status: "Running on Cloudflare Workers",
        uptime: "Always on with Cloudflare Workers",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle API routes
  if (path.startsWith("/api/")) {
    return handleApiRequest(request, path);
  }

  // For all other routes, serve the static site
  return await serveStaticAssets(request);
}

/**
 * Handle webhook requests from Telegram
 * @param {Request} request - The incoming request object
 */
async function handleWebhook(request) {
  try {
    // Parse the incoming JSON payload
    const payload = await request.json();

    // Process the update from Telegram
    await processUpdate(payload);

    // Respond with a success message
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle any errors
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Process updates from Telegram
 * @param {Object} update - The update object from Telegram
 */
async function processUpdate(update) {
  // Extract message information
  const message = update.message;
  if (!message) return; // Not a message update

  const chatId = message.chat.id;
  const text = message.text || "";

  // Handle commands
  if (text.startsWith("/")) {
    const command = text.split(" ")[0].substring(1);
    const params = text.substring(command.length + 2);

    switch (command) {
      case "start":
        return sendMessage(chatId, "Welcome to the Caption Bot! Use /help to see available commands.");
      
      case "help":
        return sendMessage(chatId, 
          "📚 <b>Command Reference</b>\n\n" +
          "<b>Channel Commands:</b>\n" +
          "• /set_caption - Set custom caption\n" +
          "• /use_template - Apply a saved template\n" +
          "• /delcaption - Reset to default caption\n" +
          "• all - Update captions for all media\n\n" +
          "<b>Template Commands:</b>\n" +
          "• /save_template - Save a caption template\n" +
          "• /templates - List all your saved templates\n" +
          "• /view_template - View a specific template\n" +
          "• /delete_template - Delete a template"
        );
      
      case "set_caption":
        if (!params.trim()) {
          return sendMessage(chatId, "Please provide a caption text. Example: /set_caption Check out this {file_name}!");
        }
        return sendMessage(chatId, `Caption set to: ${params}`);
      
      // Add more command handlers here
      
      default:
        return sendMessage(chatId, "Unknown command. Use /help to see available commands.");
    }
  }

  // Handle the "all" command for batch processing
  if (text.toLowerCase() === "all") {
    return sendMessage(chatId, "Processing all media messages in the channel. This may take some time...");
  }

  // Handle regular text messages
  return sendMessage(chatId, "I can help you manage captions for your media. Use /help to see available commands.");
}

/**
 * Send a message to a Telegram chat
 * @param {number|string} chatId - The chat ID to send the message to
 * @param {string} text - The text of the message
 * @param {Object} options - Additional options for the message
 */
async function sendMessage(chatId, text, options = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  const data = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    ...options,
  };
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  return await response.json();
}

/**
 * Handle API requests
 * @param {Request} request - The incoming request object
 * @param {string} path - The request path
 */
async function handleApiRequest(request, path) {
  // Add API endpoints as needed
  return new Response(
    JSON.stringify({ error: "Not implemented" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Serve static assets - for the web interface
 * @param {Request} request - The incoming request object
 */
async function serveStaticAssets(request) {
  // This is a placeholder for serving the static assets
  // In practice, Cloudflare Pages will handle this part
  
  // For now, return a simple HTML response
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Telegram Caption Bot</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css">
      </head>
      <body data-bs-theme="dark">
        <div class="container py-4">
          <div class="card">
            <div class="card-header">
              <h1>Telegram Caption Bot</h1>
            </div>
            <div class="card-body">
              <div class="alert alert-success">
                <h4>Bot is Running on Cloudflare Workers</h4>
                <p>The Telegram bot is active and running. Chat with <a href="https://t.me/Elizabeth_Olsen_robot">@Elizabeth_Olsen_robot</a> on Telegram.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>`,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}