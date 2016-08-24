fis.match('**.less' , {
    parser : fis.plugin('less'),
    rExt : '.css'
})
fis.match('**.tsx' , {
    parser : fis.plugin('typescript'),
    rExt : '.js'
})