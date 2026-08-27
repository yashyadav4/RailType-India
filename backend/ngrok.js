
import ngrok from "@ngrok/ngrok";
 
async function forwardToApp() {
	const forwarder = await ngrok.forward({
		addr: "localhost:5173",
		authtoken_from_env: true,
		domain: "barber-uneaten-dinner.ngrok-free.dev",
	});
	console.log(`Available at: ${forwarder.url()}`);

	// Keep the Node.js process alive so the tunnel stays open
	process.stdin.resume();
}
 
forwardToApp();