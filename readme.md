# UCLA Computer Science Makeover

This project is an [Express.js](https://expressjs.com) server that serves UCLA
Computer Science course web pages using custom CSS.
This project is motivated by the plain-HTML look of the web pages
and the desire for a dark theme.

The project is currently hosted [here](https://cs-makeover.fly.dev), using [fly.io](https://fly.io).

## Features

1. Render a beautified version of any past, present, or future UCLA CS web page
hosted on [web.cs.ucla.edu](http://web.cs.ucla.edu/).
2. Supports light or dark mode, depending on your system configuration.

## Future directions

* Add breadcrumbs at the top of each page
* In the landing page, add a script that saves the user's last-entered
subdirectory into local storage

## Run the app locally

1. Have Git and Node installed.
2. Open a terminal and clone the repository:
```
git clone https://github.com/NeekTheGiraffe/cs-makeover.git
```
3. Install node dependencies and run the app:
```
cd cs-makeover
npm install
npm run dev
```
You will see a log that looks like this:
```
App listening on port 3000
```
4. Navigate to [http://localhost:3000](http://localhost:3000)
(or whatever port number the log said) and run the app!