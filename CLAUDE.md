# Style Guidelines

1. Don't write code comments.
2. Co-locate related code together in the same file.
3. Avoid folder & file sprawl.
4. Use enums instead of string unions in server code. Frontend code (`.svelte` files) uses string unions, since Svelte can't compile enums in components.
5. Prefer types over interfaces.
6. Avoid "Clean Code" style tiny functions that are only called once. Prefer longer function bodies that contain the whole implementation.
7. Simplicity. Simplicity. Simplicity.
8. Emphasize readability of code over conciseness.
9. Use upper case for acronyms in names. `toJson` -> `toJSON`
10. Use `assert` from es-toolkit for checking assumptions & preconditions, such as a variable being defined/non-null.
11. Use dependency injection. Functions take dependencies as parameters instead of referencing global variables. This keeps code testable.
