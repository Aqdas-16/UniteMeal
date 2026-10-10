const fs = require('fs');

let eb = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
eb = eb.replace('export class ErrorBoundary extends React.Component<Props, State> {', `export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }`);
// Remove the public state: State = { ... } part because we set it in constructor.
eb = eb.replace(/public state: State = \{[\s\S]*?\};\n/, '');
// change this.props to this.props! just in case, or we just rely on constructor.
fs.writeFileSync('src/components/ErrorBoundary.tsx', eb);
