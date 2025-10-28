---
layout: ../../layouts/PostLayout.astro
title: "Javascript todo app for the absolute beginner"
pubDate: 2019-10-02
description: "A simple todo app using vanilla JavaScript for the absolute beginner"
tags:
- tutorial
- javascript
---

TLDR:
- Add a `<li>` element to a `<ul>`  list of todos when a `form` is submitted.
- Delete todos using an `onclick` handler.

## Motives

After reading Chris Coyier's [post on reduced test cases](https://css-tricks.com/reduced-test-cases/) I became intrigued with ways to simplify certain programming tasks (though the article is about something different). As it's often stated, the best way to write code is to write no code. At the present moment, we can not do away with code. However we can:

1. Reduce the amount of code need to achieve an end
2. Make code simpler to understand

I am not a huge fan of using a nuclear bomb on an ant (i.e. a full-fledged framework on a simple task), so I'll stick to vanilla Javascript.

### Why a todo app?

Working on projects is the best way to actually learn programming and break out of tutorial rut. And damn do I love todo apps! I am the kind of person who can't get anything done unless it's written down. Writing a todo app (for the umpteenth time) is always fun. Todo apps are often [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) i.e. involve operations to create, read, update and delete data.  Also, a lot of benchmarks for frameworks and introductory documentation for libraries use todo apps.

## Objectives

By the end of this post, I hope that an absolute beginner can be able to:

- understand basic [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction) manipulation using JavaScript
- code a basic JS CRUD app

## Gotchas

Since this is meant to be simple to understand, there are some trade-offs that I had to make, including:

1. Data is not separated from the UI
2. Absolutely no validation or handling of edge cases and errors

This might not be the simplest version out there, but I will update this post with any suggestions that makes the app simpler (and not necessarily with less code).

## Prerequisites

1. Knowledege of HTML
2. Knowledge of (basic) CSS
3. Introductory knowledge in Javascript

## Finally, code!

Note: I will be using some [ES6](http://es6-features.org/#Constants) features.

### HTML skeleton

Create a new file ideally using an [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) such as [Visual Studio Code](https://code.visualstudio.com/) and [Sublime](https://www.sublimetext.com/) (or any text editor for that matter). We'll start with a basic skeleton for the app. 

Write the following code:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Minimal JS todo app</title>
</head>
<body>

  <!-- list of todos -->
  <ul>
    <li>Read Composing Software by Eric Elliot</li>
    <li>Take a walk</li>
  </ul>

</body>
</html>
```

Save the file as `<todo-app>.html` . Open the file in the browser. 

### Form to add todos

In order to add a todo, we'll get the text of the todo from a form. Let's create it:

```html
<!DOCTYPE html>
<html>
<head>
  <title>TLDR JS todo app</title>
</head>
<body>

  <!-- list of todos -->
  <ul>
    <li>Read Composing Software by Eric Elliot</li>
    <li>Take a walk</li>
  </ul>
    
  <!-- form to add todos -->
  <form>
    <label for="todo-input">Todo:</label>
    <input type="text" id="todo-input">

    <input type="submit" value="Add">
  </form>

</body>
</html>
```

### Adding a todo

We will use ES6 [string templates](http://es6-features.org/#StringInterpolation) and the [`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) property of DOM nodes to create the HTML.

Here's where JavaScript drops in. We'll 'hijack' the submit event of the form then use the value of the text input as the todo text.

Usually, submitting a form sends a request to the server and reloads the page. We will prevent that by  using the `preventDefault()` method of the event that's passed in as a parameter.

```html
<!DOCTYPE html>
<html>
<head>
  <title>TLDR JS todo app</title>
</head>
<body>
  <!-- list of todos -->
  <ul id="todos"></ul>
    
  <!-- form to add todos -->
  <form id="todo-form">
    <label for="todo-input">Todo:</label>
    <input type="text" id="todo-input">

    <input type="submit" value="Add">
  </form>
    
  <script>
    // 'select' elements
  	const todoForm = document.getElementById('todo-form')
    const todoInput = document.getElementById('todo-input')
    const todosList = document.getElementById('todos')

    // whenever the form is submitted, our arrow function 'event => { ... }' runs
    todoForm.addEventListener('submit', event => {
        
      // prevent page reload
      event.preventDefault()

      // create a <li> element
      const todoEl = document.createElement('li')
      
      // parse the value of the text input
      todoEl.innerHTML = `<span>${todoInput.value}</span>`
      
      // add <li> to <ul>
      todosList.appendChild(todoEl)
    })
  </script>
</body>
</html>
```

Refresh the page and confirm you can add a todo. If so, yay!

#### Styling the list

Let's remove the list marker. 

Add the following CSS styles to the `<head>`:

```html
<head>
  <title>TLDR JS todo app</title>
    
  <style>
    #todos {
      list-style-type: none;
      padding-left: 0;
    }
  </style>
</head>
<body>
  <!-- rest of code -->
</body>
```

### Marking a todo as done/not done

We will use a check-box to mark a todo as done or not done, and then use CSS to strike-through todos that are marked as done.

We will modify the todo template to add the check-box,

```js
todoEl.innerHTML = `
  <input type="checkbox">
  <span>${todoInput.value}</span>
`
```

and then style accordingly:

```html
<style>
    #todos {
      list-style-type: none;
      padding-left: 0;
    }
    
    /* if a checkbox is checked, strikethrough the sibling span element */
    input[type=checkbox]:checked + span {
      text-decoration: line-through;
    }
</style>
```

Save the file, and then refresh the page. Add a todo item and then click on the checkbox to mark it as done.

### Editing a todo

This is where I had to cheat so as not to complicate things : ). The `contenteditable` attribute indicates whether an element can be edited by the user. 

Still on the todo template:

```js
todoEl.innerHTML = `
  <input type="checkbox">
  <span contenteditable="true">${todoInput.value}</span>
`
```

Add a todo. Click on the todo text. Edit the text. Click outside the widget.

### Deleting a todo

This might be a bit tougher to wrap your head around.

Let's add a button to the todo template.

```js
todoEl.innerHTML = `
  <input type="checkbox">
  <span contenteditable="true">${todoInput.value}</span>
  <button>Delete</button>
`
```

Finally, the functionality:

```js
todoEl.innerHTML = `
  <input type="checkbox">
  <span contenteditable="true">${todoInput.value}</span>
  <button onclick="this.parentNode.remove()">Delete</button>
`
```

We add an `onclick` event listener to the button. Then we can access the current element (the button), using the [dreaded `this`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/this). In short, `this` in JavaScript represents the current execution context. In this case, `this` refers to the `<button>`. After accessing the button, we can access it's parent element, the `<li>` using the `parentNode` property. We can then simply remove the todo from the UI using the `remove()` method of the `<li>`.

Save the file then refresh the page in the browser. Add a todo, then click on the `Delete` button. If it works, congrats.

### Complete code

```html
<!DOCTYPE html>
<html>
<head>
  <title>Minimal JS todo app</title>
</head>

<style>
  #todos {
    list-style-type: none;
    padding-left: 0;
  }

  /* if a checkbox is chcked, strikethrough the sibling span element */
  input[type=checkbox]:checked + span {
    text-decoration: line-through;
  }
</style>
<body>
  <!-- list of todos -->
  <ul id="todos"></ul>
    
  <!-- form to add todos -->
  <form id="todo-form">
    <label for="todo-input">Todo:</label>
    <input type="text" id="todo-input">

    <input type="submit" value="Add">
  </form>
    
  <script>
    // 'select' elements
  	const todoForm = document.getElementById('todo-form')
    const todoInput = document.getElementById('todo-input')
    const todosList = document.getElementById('todos')

    // whenever the form is submitted, our arrow function 'event => { ... }' runs
    todoForm.addEventListener('submit', event => {
        
      // prevent page reload
      event.preventDefault()

      // create a <li> element
      const todoEl = document.createElement('li')
      
      // todo template
      todoEl.innerHTML = `
        <input type="checkbox">
        <span contenteditable="true">${todoInput.value}</span>
        <button onclick="this.parentNode.remove()">Delete</button>
      `
      
      // add <li> to <ul>
      todosList.appendChild(todoEl)
    })
  </script>
</body>
</html>
```

## Conclusion

Thanks for reading to the end of the article. This is my first ever article. If you have any suggestions, typos, et cetera, be sure to leave a comment or shoot me an [email](mailto:nevilleomangi@gmil.com).

Shoutout to [Yazeed Bzadough](https://yazeedb.com/) for getting me started on this path of creating through his awesome blog.
