import React, { Component } from 'react';
import ride from 'ride';

class God extends Component {
  traverseGOD = () => {
    let components = [];
    let dom = this._reactInternalInstance._renderedComponent
    recursiveTraverse(dom, components)
    top.postMessage({ data: components }, '*')
    return components

    function recursiveTraverse(component, parentArr) {
      let newComponent = {}

      if (!component._currentElement) return
      if (component._closingComment) return // catch bootstrap things

      newComponent.name = component._currentElement && component._currentElement.type.name || component._currentElement.type || 'nothing'
      newComponent.state = component && component._instance && component._instance.state || null
      newComponent.children = [];

      const componentChildren = component._renderedChildren
      parentArr.push(newComponent);
      if (componentChildren) {
        for (let key in componentChildren) {
          recursiveTraverse(componentChildren[key], newComponent.children)
        }
      }
      else if (component._renderedComponent) {
        recursiveTraverse(component._renderedComponent, newComponent.children)
      }
    };
  }

  componentDidMount() {
    window.addEventListener('attached', e => {
      console.log('detected event')
      this.traverseGOD()
    })

    ride(React.Component.prototype, 'setState')
      .after(() => {
        this.traverseGOD();
      });

    console.log(this)
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
