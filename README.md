## FHV-Student-Hub
A modern, responsive web application prototype for a centralized student platform at the Vorarlberg University of Applied Sciences.

### Features

- **Student Dashboard**: Overview of upcoming campus events & internal FHV links for quick access
- **Resources**: Access to learning opportunities & materials
- **Benefits**: View semester benefits & student discounts from the Austrian Students' Union (ÖH)
- **FHV Brand Colors**: Uses 4 official FHV colors (Lavender, Light Blue, Yellow, Orange-Red)
- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **Responsive Design**: Fully responsive layout using Tailwind CSS
- **Language**: Change between German and English

### File Structure

```
student-platform/
├── index.html        # Main HTML structure
├── resources.html    # File for Semester Resources
├── courses.html      # File for Semester Courses
├── benefits.html     # File for ÖH Benefits & Info
├── styles.css        # Custom styles, dark mode and responsive design
├── script.js         # JavaScript for navigation, toggles, calendar, etc.
├── german.js         # German language integration
└── README.md         # This file
```

### FHV Colors Used

The application uses the official FHV color palette: 

- **Primary**: `#C0A1CC` (Lavender)
- **Secondary**: `#9ACFF1` (Light Blue)
- **Tertiary**: `#FFDC5F` (Yellow)
- **Accent**: `ee7551` (Orange-Red)
- **Dark-Mode Background**: `16161D` (Bluish Black)

These colors are defined as CSS variables in `styles.css` and can be customized if needed.

### How to Use

1. **Open the Application**: Simply open `index.html` in a web browser
2. **Toggle Dark Mode**: Click the moon / sun icon in the top navigation bar
3. **Toggle Language**: Click the EN / DE button in the top navigation bar
4. **Navigate**: Use the navigation menu to switch between different sections
5. **Responsive**: The layout adapts to different screen sizes automatically

### Dark Mode Features

- **Automatic Detection**: Detects system preference on first visit
- **Persistent**: Saves your preference in browser localStorage
- **Smooth Transitions**: All color changes are animated smoothly
- **Icon Animation**: Theme toggle icon rotates when switching themes

### Technologies Used

- **HTML5**: Semantic markup
- **Tailwind CSS**: Custom properties & responsive layout
- **Vanilla JavaScript**: No dependencies, pure JavaScript
- **Cursor AI**: Refactoring and improving features

### Browser Support

Works on all modern browsers that support:
- CSS Custom Properties (CSS Variables)
- ES6 JavaScript
- LocalStorage API

### Customization

#### Adding New Sections

1. Add a new `<section>` in `index.html` with a unique `id`
2. Add a navigation link in the navbar pointing to `#your-section-id`
3. The JavaScript will automatically handle showing/hiding sections

#### Modifying Colors

Edit the CSS variables in `styles.css` under `:root` and `[data-theme="dark"]` to customize the color scheme.

#### Adding Functionality

The JavaScript is modular and organized into IIFEs (Immediately Invoked Function Expressions). You can add new functionality by creating new IIFE blocks in `script.js`.

### Notes

- This is a prototype/demo application
- All data shown is sample/mock data
- No backend integration is included
- Ready for integration with a backend API
- AI was used for refactoring and expanding code
