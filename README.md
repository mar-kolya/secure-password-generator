# Secure Password Generator
Easy to use add-on to create random secure passwords.

## Install npm dependencies
Prepare npm environment with:
```
npm install
```

## Development
Build with:
```
npm run build
```

In separate shell:
```
npm run start
```

This will start up the process and reload add-on automtically when
file change.

## Update dependencies
Before releasing new version do
```
npm shrinkwrap --dev
```

## Packaging
```
npm run package
```

This can be extracted and used with the Firefox `about:debugging` page to test.
