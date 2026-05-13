import { useEffect, useState } from 'react';

function App() {
	const [serverMsg, setServerMsg] = useState('');

	useEffect(() => {
		fetch('/api')
			.then((r) => r.json())
			.then((data) => setServerMsg(data.message));
	}, []);

	return (
		<div>
			<h1 className="text-3xl font-bold underline">Hello world!</h1>
			<p>Hello from the client side!</p>
			<p>{serverMsg || 'Loading server message...'}</p>
		</div>
	);
}

export default App;
