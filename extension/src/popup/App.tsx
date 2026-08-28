export default function App() {
  return (
    <main
      style={{
        width: 320,
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>Mail Tracker</h2>

      <p>
        Extension is running.
      </p>

      <button
        onClick={() => {
          chrome.runtime.sendMessage(
            { type: "PING" },
            (response) => {
              console.log(response);
            }
          );
        }}
      >
        Test Connection
      </button>
    </main>
  );
}
