import React, { Component } from 'react';
import ride from 'ride';

/** Wrapper component to send messages to React Sight© extension */
class God extends Component {
  store = []

  /** TODO - flattening...
   * 
   * iterate through props list
   */
  parseProps = (currentComponent) => {
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
      for (let properties in component._instance) {
        if (typeof component._instance[properties] === 'function' && properties !== 'render') {
          let newObj = {}
          newObj[properties] = "" + component._instance[properties]
          newComponent.methods.push(newObj)
        }
      }
    }

    //go into children of current component
    const componentChildren = component._renderedChildren
    parentArr.push(newComponent);
    if (componentChildren) {
      for (let key in componentChildren) {
        this.recursiveTraverse(componentChildren[key], newComponent.children)
      }
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

  /** 
   * When component Mounts, add a listener for React-Sight extension. When extension loads,
   * a message will be emitted and this component will respond with data so that extension 
   * can draw when it first loads
   */
  componentDidMount() {
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
