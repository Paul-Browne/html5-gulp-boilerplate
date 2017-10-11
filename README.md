# html5-gulp-boilerplate

This is a bit more than a html5 and gulp boilerplate, it also includes setup for

|feature|check|
|--|--|
|express server|:white_check_mark:|
|gzip|:white_check_mark:|
|https*|:white_check_mark:|
|http2*|:white_check_mark:|
|html, css, js minifier|:white_check_mark:|
|html, css, js prettifier|:white_check_mark:|
|js uglifier|:white_check_mark:|
|css precompilers: sass, less|:white_check_mark:|
|html precompilers: jade|coming soon|
|css autoprefixing: css, sass, less|:white_check_mark:|
|css, js combiner|coming soon|
|image optimization|:white_check_mark:|

###### https and http2 require setup of https for localhost


#### to install
`npm install`

#### start
`gulp`

#### prettify contents in the /src directory
`gulp prettify`

#### delete the /dist directory
`gulp clean`

#### to use https://localhost


for mac users
```bash
$ cd && mkdir .ssl
$ openssl version || brew install openssl
$ openssl req -newkey rsa:2048 -x509 -nodes -keyout .ssl/localhost.key -new -out .ssl/localhost.crt -subj /CN=localhost -reqexts SAN -extensions SAN -config <(cat /System/Library/OpenSSL/openssl.cnf <(printf '[SAN]\nsubjectAltName=DNS:localhost')) -sha256 -days 3650
$ sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .ssl/localhost.crt
```

