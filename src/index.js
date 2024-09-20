addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const url = new URL(request.url)
    if (url.pathname === '/' || url.pathname.startsWith('/index.html')) {
        const response = await fetch('https://it-engineer-game.vazhimov.workers.dev/index.html')
        return new Response(response.body, {
            headers: { 'content-type': 'text/html;charset=UTF-8' },
        })
    }
    // Обработка статических файлов
    return fetch(request)
}