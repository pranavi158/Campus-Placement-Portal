from flask import Flask

app = Flask(__name__)

# Homepage
@app.route('/')
def home():
    return """
    <html>
    <head><title>TaskMaster</title></head>
    <body>
        <h1>Welcome to TaskMaster!</h1>
        <p>Your personal task management application.</p>
        <nav>
            <a href="/tasks">View Tasks</a> |
            <a href="/category/work">Work Tasks</a> |
            <a href="/category/personal">Personal Tasks</a> |
            <a href="/about">About</a>
        </nav>
    </body>
    </html>
    """

# Tasks page
@app.route('/tasks')
def tasks():
    return """
    <h1>All Tasks</h1>
    <p>Your tasks will appear here once we connect a database!</p>
    <a href="/">Back to Home</a>
    """

# Category filter page (Dynamic Route)
@app.route('/category/<name>')
def category(name):
    return f"""
    <h1>Category: {name.title()}</h1>
    <p>Showing all tasks in the <strong>{name}</strong> category.</p>
    <a href="/">Back to Home</a>
    """

# Task detail page (Dynamic Route with int converter)
@app.route('/task/<int:task_id>')
def task_detail(task_id):
    return f"""
    <h1>Task #{task_id}</h1>
    <p>Details for task {task_id} will appear here.</p>
    <a href="/tasks">Back to Tasks</a>
    """

# About page
@app.route('/about')
def about():
    return """
    <h1>About TaskMaster</h1>
    <p>TaskMaster is a simple task management app built with Flask.</p>
    <p>Created as part of the MAD 1 Bootcamp.</p>
    <a href="/">Back to Home</a>
    """

if __name__ == '__main__':
    app.run(debug=True)
