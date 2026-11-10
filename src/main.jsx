import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles.css';
import { render } from 'preact';
import { App } from './app.jsx';

render(<App />, document.getElementById('app'));
