import React, { Component } from 'react';
import ride from 'ride';
import Tree from './Tree'

class God extends Component {
  traverseGOD = () => {
    let components = [];
    let dom = this._reactInternalInstance._renderedComponent
    recursiveTraverse(dom, components)
    top.postMessage(JSON.stringify({ data: components }), '*')
    return components
  }
  //THE CHILDREN PROPERTY SHOULD NOT SHOW UP ON THE SIDE PANEL on FE
  recursiveTraverse = (component, parentArr) => {
    let newComponent = {}
    //base case
    if (!component._currentElement) return
    // newComponent.name = component._currentElement.type.name || component._currentElement.type
    newComponent._children = [];
    //if current 'component' is a custom Component
    if (component._currentElement.type.name) {
      newComponent.name = component._currentElement.type.name
      newComponent.state = component && component._instance && component._instance.state || null
      newComponent.props = component && component._instance && component._instance.props || null
      for (let properties in component._instance) {
        if (typeof component._instance[properties] === 'function' && properties !== 'render') {
          newComponent[properties] = component._instance[properties]
        }
      }
      //if current 'component' is a DOM node
    } else {
      newComponent.domNode = component._currentElement.type
    }
    //go into children
    const componentChildren = component._renderedChildren
    parentArr.push(newComponent);
    if (componentChildren) {
      for (let key in componentChildren) {
        this.recursiveTraverse(componentChildren[key], newComponent._children)
      }
    }
    else if (component._renderedComponent) {
      this.recursiveTraverse(component._renderedComponent, newComponent._children)
    }
  };

  componentDidMount() {
    ride(React.Component.prototype, 'setState')
      .after(() => {
        this.traverseGOD()
      });
    console.log(this)
  }

  componentDidUpdate() {
    this.traverseGOD()
  }

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

export default God;
