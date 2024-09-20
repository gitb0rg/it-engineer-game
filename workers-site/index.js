// workers-site/index.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  let path = url.pathname

  if (path === '/') {
    path = '/index.html'
  }

  try {
    const object = await ASSETS.get(path)
    if (!object) {
      // Возвращаем index.html для всех неизвестных маршрутов (SPA)
      return ASSETS.get('/index.html')
    }
    return new Response(object.body, { headers: { "Content-Type": getContentType(path) } })
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 })
  }
}

function getContentType(path) {
  const extension = path.split('.').pop()
  switch (extension) {
    case 'html':
      return 'text/html'
    case 'js':
      return 'application/javascript'
    case 'css':
      return 'text/css'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'mp3':
      return 'audio/mpeg'
    case 'webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}