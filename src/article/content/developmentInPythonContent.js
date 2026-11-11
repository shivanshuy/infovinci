const developmentInPythonContent = {
    header: "How to start development in Python?",
    text: "Tooling, Libraries, Frameworks, and more.",
    contents: [
        {
            type: "header",
            text: "Setup in Visual Studio Code"
        },
        {
            type: "text",
            text: `Install Python extension for Visual Studio Code.`
        },
        {
            type: "reference",
            href: "https://marketplace.visualstudio.com/items?itemName=ms-python.python",
            text: "Python extension for Visual Studio Code"
        },
        {
            type: "header",
            text: "Virtual Environment"
        },
        {
            type: "text",
            text: `By default, any Python interpreter installed runs in its own global environment. For example, if you just run python, python3, or py at a new terminal (depending on how you installed Python), you're running in that interpreter's global environment. Any packages that you install or uninstall affect the global environment and all programs that you run within it.
            A virtual environment is a built-in way to create an environment. A virtual environment creates a folder that contains a copy (or symlink) to a specific interpreter. When you install packages into a virtual environment it will end up in this new folder, and thus isolated from other packages used by other workspaces.`
        },
        {
            type: "header",
            text: "Steps to start development in Python"
        },
        {
            type: "text",
            text: `Quick start guide to Python development in Visual Studio Code.`
        },
        {
            type: "reference",
            href: "https://code.visualstudio.com/docs/python/environments",
            text: "Python development in Visual Studio Code"
        },
        {
            type: "header",
            text: "Managing Dependenncies" 
        },
        {
            type: "text",
            text: `Poetry is a tool for dependency management and packaging in Python. It allows you to declare the libraries your project depends on and it will manage (install/update) them for you.`
        },
        {
            type: "reference",
            href: "https://python-poetry.org/docs",
            text: "Poetry - Python dependency management"
        },
        {
            type: "header",
            text: "Project setup using Poetry" 
        },
        {
            type: "text",
            text: `Steps to setup a new project using Poetry.`
        },
        {
            type: "code",
            code: `poetry new poetry-demo`
        },
        {
            type: "header",
            text: "Optional - Create Virtual Environment Prgramatically" 
        },
        {
            type: "code",
            code: `python -m venv <virtual-env-name like tutorial-env>`
        },
        {
            type: "header",
            text: "Activate Virtual Environment"
        },
        {
            type: "text",
            text: `Activating the virtual environment will change your shell’s prompt to show what virtual environment you’re using, and modify the environment so that running python will get you that particular version and installation of Python.`
        },
        {
            type: "code",
            code: `tutorial-env\\Scripts\\activate`
        },
        {
            type: "reference",
            href: "https://docs.python.org/3/tutorial/venv.html",
            text: "venv - Creation of virtual environments"
        },
        {
            type: "header",
            text: "Installing Poetry" 
        },
        {
            type: "code",
            code: `python -m pip install poetry`
        },
        {
            type: "header",
            text: "Installing Dependencies" 
        },
        {
            type: "text",
            text: `To install the defined dependencies for your project, just run the install command.`
        },
        {
            type: "code",
            code: `python -m poetry install`
        },
    ]
}
export default developmentInPythonContent;