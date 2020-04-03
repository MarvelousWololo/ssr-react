import React from "react";

const Hello = (props) => (
  <React.Fragment>
    <h1>Hello, {props.name}!</h1>

    <p>
      You can change this parameter by requesting <code>name</code> with a query
      string, like:
    </p>

    <pre>/?name=John Doe</pre>

    <a href="/with-react-router">with React Router</a>
  </React.Fragment>
);

export default Hello;
