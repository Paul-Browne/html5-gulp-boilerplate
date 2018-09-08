# html5-gulp-boilerplate

This is a bit more than a html5 and gulp boilerplate, it also includes setup for

|feature|check|
|--|--|
|express server|:white_check_mark:|
|gzip, https^, http2^|:white_check_mark:|
|html, css, js minifier|:white_check_mark:|
|html, css, js prettifier|:white_check_mark:|
|js uglifier|:white_check_mark:|
|css precompilers: sass, less|:white_check_mark:|
|css autoprefixing: css, sass, less|:white_check_mark:|
|css and js file combining|:white_check_mark:|
|image resizing|:white_check_mark:|
|image optimization|:white_check_mark:|

###### ^ https and http2 require setup of https for localhost

for mac users

`brew install imagemagick`

`brew install graphicsmagick`

#### to install
`npm install`

#### build, serve and watch
`npm run bsw`

#### just build
`npm run build`

#### delete the /dist directory
`npm run clean`

#### delete the /dist directory **inc. images**
`npm run clean-all`

#### prettify contents in the /src directory
`npm run pretty`





#### to use https://localhost

for mac users
```bash
$ cd; mkdir .ssl
$ openssl version || brew install openssl
$ openssl req -newkey rsa:2048 -x509 -nodes -keyout .ssl/localhost.key -new -out .ssl/localhost.crt -subj /CN=localhost -reqexts SAN -extensions SAN -config <(cat /System/Library/OpenSSL/openssl.cnf <(printf '[SAN]\nsubjectAltName=DNS:localhost')) -sha256 -days 3650
$ sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .ssl/localhost.crt
```

If you're seeing any errors related to image packages/libraries it may help to build imagemagick and/or graphicsmagick from source

`brew uninstall imagemagick`

`brew install imagemagick --build-from-source`

