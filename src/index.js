import React, { Component } from 'react';
import ride from 'ride';

/** Wrapper component to send messages to React Sight© extension */
class God extends Component {
  store = []
  version = null;
  /** TODO - flattening...
   *
   * iterate through props list
   */
  parseProps = (currentComponent) => {
    console.log('# parseProps')
    let newProps = {}
    const keys = Object.keys(currentComponent)
    keys.forEach(key => {
      // Functions
      if (typeof currentComponent[key] === 'function') newProps[key] = '' + currentComponent[key]
      // Objects
      else if (typeof currentComponent[key] === 'object') newProps[key] = currentComponent[key]
      // Children - TODO flatten this object
      else if (key === 'children') {
        newProps[key] = new currentComponent[key].constructor
        if (Array.isArray(currentComponent[key])) {
          currentComponent[key].forEach(child => {
            newProps[key].push(child && child.type && child.type.name)
          })
        }
        else newProps[key].name = currentComponent[key].type && currentComponent[key].type.name
      }
      else newProps[key] = currentComponent[key]
      return newProps
    })
  }

  /** Traverse through virtual DOM and add data to array */
  recursiveTraverse = (component, parentArr) => {
    // if no current element, return
    if (!component._currentElement) return

    const newComponent = { children: [], id: component._debugID }

    if (component.constructor.name === 'ReactDOMTextComponent') {
      //current component is a TEXT NODE .. ie. <p>I AM ReactDOMTextComponent</p>
      //do nothing? LINE BELOW IS STILL IN TESTING TO PASS THRU DOM TEXT
      // component = component._renderedComponent
      newComponent.name = component._currentElement
    }
    else if (component.constructor.name === 'ReactDOMComponent') {
      //current component is a DOM node;
      newComponent.name = component._currentElement.type
      //BELOW IS STILL IN TESTING: trying to grab props and its className from a DOM NODE
      const domProps = component._currentElement.props || null
      newComponent.props = this.parseProps(domProps)
      newComponent.type = component.constructor.name
    }

    else if (component.constructor.name === 'ReactCompositeComponentWrapper') {
      newComponent.name = component._currentElement.type && component._currentElement.type.name
      newComponent.state = component && component._instance && component._instance.state || null
      newComponent.type = component.constructor.name
      if (component._currentElement.type.name === 'Connect' || component._currentElement.type.name === 'Provider') {
        newComponent.type = "ReduxComponent"
        this.store = component._instance.store.getState()
      }
      let copyProps = component && component._instance && component._instance.props || null
      newComponent.props = this.parseProps(copyProps)
      newComponent.methods = []
      const keys = Object.keys(component._instance)
      keys.forEach(properties => {
        if (typeof component._instance[properties] === 'function' && properties !== 'render') {
          let newObj = {}
          newObj[properties] = "" + component._instance[properties]
          newComponent.methods.push(newObj)
        }
      })
    }

    //go into children of current component
    const componentChildren = component._renderedChildren
    parentArr.push(newComponent);
    if (componentChildren) {
      const keys = Object.keys(componentChildren)
      keys.forEach(key => {
        this.recursiveTraverse(componentChildren[key], newComponent.children)
      })
    }
    else if (component._renderedComponent) {
      this.recursiveTraverse(component._renderedComponent, newComponent.children)
    }
  };

  /** Traverse through virtual DOM and post message to React Sight extension  */
  traverseGOD = (components = []) => {
    const dom = this._reactInternalInstance._renderedComponent._renderedChildren['.0']
    this.recursiveTraverse(dom, components)
    const data = { data: components, store: this.store }
    window.postMessage(JSON.parse(JSON.stringify(data)), '*')
  }

  /** TODO: Get State & Props
   *
   *
   * Traverse through vDOM (React 16) and build up JSON data
   *
   */
  recur16 = (node, parentArr) => {
    const newComponent = {
      name: '',
      children: [],
      state: null,
      props: null,
    }

    // get name
    if (node.type) {
      if (node.type.name) newComponent.name = node.type.name
      else newComponent.name = node.type
    }

    // get state
    if (node.memoizedState) newComponent.state = node.memoizedState

    // get props
    if (node.memoizedProps) newComponent.props = this.props16(node)

    newComponent.children = []
    // console.log('node:', node)
    // console.log('name:', newComponent.name)
    parentArr.push(newComponent)
    if (node.child != null) this.recur16(node.child, newComponent.children)
    if (node.sibling != null) this.recur16(node.sibling, parentArr)
  }
  /** TODO - get objects to work
   *
   * Parse the props for React 16 components
   */
  props16 = node => {
    const props = {}
    const keys = Object.keys(node.memoizedProps)
    keys.forEach(prop => {
      // console.log(`${prop}:  ${node.memoizedProps[prop]}`)
      if (typeof node.memoizedProps[prop] === 'function') {
        props[prop] = '' + node.memoizedProps[prop]
      }
      else if (typeof node.memoizedProps[prop] === 'object') {
        props[prop] = 'object*'
        // props[prop] = node.memoizedProps[prop] // bad
      }
      else if (prop === 'children') {
        props[prop] = new node.memoizedProps[prop].constructor
        if (Array.isArray(node.memoizedProps[prop])) {
        node.memoizedProps[prop].forEach(child => {
        props[prop].push(child && child.type && child.type.name)
        })
        }
        else props[prop].name = node.memoizedProps[prop].type && node.memoizedProps[prop].type.name
      }

      else props[prop] = node.memoizedProps[prop]
    })
    return props;
  }

  /** Traversal Method for React 16 */
  traverse16 = (components = []) => {
    const vDOM = this._reactInternalFiber
    this.recur16(vDOM, components)
    const data = { data: components }
    window.postMessage(JSON.parse(JSON.stringify(data)), '*')
  }
  /**
   * When component Mounts, add a listener for React-Sight extension. When extension loads,
   * a message will be emitted and this component will respond with data so that extension
   * can draw when it first loads
   */
  componentDidMount() {
    this.version = React.version
    console.log('version', this.version)
    // experimental react 16 support
    if (this.version === '16.0.0') this.traverseGOD = this.traverse16

    window.addEventListener('attached', e => {
      console.log('detected event')
      this.traverseGOD()
    })
    // Dynamically Patch setState at runtime to call traverseGod
    ride(React.Component.prototype, 'setState')
      .after(() => { this.traverseGOD() });
    console.log('This: ', this)
  }
  // Render the children of the props
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

export default God;
