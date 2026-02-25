export default {
  async fetch(request) {
    const url = new URL(request.url)
    url.hostname = 'api-internal.chummycollective.com'
    return fetch(new Request(url.toString(), request))
  },
}
