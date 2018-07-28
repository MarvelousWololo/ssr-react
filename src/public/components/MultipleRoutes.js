import React from 'react'
import { Link, Route } from 'react-router-dom'

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
)

const About = () => (
  <div>
    <h2>About</h2>
  </div>
)

const Topics = ({ match }) => (
  <div>
    <h2>Topics</h2>
    <ul>
      <li>
        <Link to={`${match.url}/rendering`}>Rendering with React</Link>
      </li>
      <li>
        <Link to={`${match.url}/components`}>Components</Link>
      </li>
      <li>
        <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
      </li>
    </ul>

    <Route path={`${match.url}/:topicId`} component={Topic} />
    <Route
      exact
      path={match.url}
      render={() => <h3>Please select a topic.</h3>}
    />
  </div>
)

const Topic = ({ match }) => (
  <div>
    <h3>{match.params.topicId}</h3>
  </div>
)

const MultipleRoutes = () => (
  <div>
    <ul>
      <li>
        <Link to="/with-react-router">Home</Link>
      </li>
      <li>
        <Link to="/with-react-router/about">About</Link>
      </li>
      <li>
        <Link to="/with-react-router/topics">Topics</Link>
      </li>
      <li>
        <a href="/">return to server</a>
      </li>
    </ul>

    <hr />

    <Route exact path="/with-react-router" component={Home} />
    <Route path="/with-react-router/about" component={About} />
    <Route path="/with-react-router/topics" component={Topics} />
  </div>
)

export default MultipleRoutes
