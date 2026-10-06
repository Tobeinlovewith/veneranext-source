class ComicSource18Comic extends ComicSource {
    name = "18Comic"
    key = "18comic.vip"
    version = "1.0.1"
    minAppVersion = "1.16.0"
    url = "https://raw.githubusercontent.com/Tobeinlovewith/veneranext-source/main/18comic.js"

    baseUrl = "https://18comic.vip"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Referer": "https://18comic.vip/"
    }

    init() {}

    async request(url) {
        let res = await Network.get(url, this.headers)

        if (res.status !== 200) {
            throw "HTTP " + res.status
        }

        return res
    }

    absoluteUrl(url) {
        if (!url) return ""

        if (url.startsWith("//")) {
            return "https:" + url
        }

        if (url.startsWith("http://") ||
            url.startsWith("https://")) {
            return url
        }

        if (url.startsWith("/")) {
            return this.baseUrl + url
        }

        return this.baseUrl + "/" + url
    }

    getId(url) {
        if (!url) return ""

        let m = url.match(/\/(?:album|photo)\/(\d+)/)

        if (m) {
            return m[1]
        }

        return ""
    }

    parseComic(element) {
        let a = element.querySelector("a")

        if (!a) return null

        let href = a.attributes["href"] || ""
        let id = this.getId(href)

        if (!id) return null

        let title = a.text.trim()

        if (!title) {
            title = element.text.trim()
        }

        if (!title) {
            title = "Album " + id
        }

        let cover = ""
        let img = element.querySelector("img")

        if (img) {
            let attrs = img.attributes

            cover =
                attrs["data-src"] ||
                attrs["data-original"] ||
                attrs["data-lazy-src"] ||
                attrs["src"] ||
                ""
        }

        return {
            id: id,
            title: title,
            cover: this.absoluteUrl(cover),
            tags: [],
            description: ""
        }
    }

    search = {
        load: async (keyword, options, page) => {

            let url =
                this.baseUrl +
                "/search/photos?main_tag=0" +
                "&search_query=" +
                encodeURIComponent(keyword) +
                "&search-type=photos" +
                "&page=" +
                page

            let res = await this.request(url)

            let document = new HtmlDocument(res.body)

            let comics = []

            let elements = document.querySelectorAll(
                "div.gallery, div.photo-list, div.list-item, .gallary_item"
            )

            for (let element of elements) {

                let comic = this.parseComic(element)

                if (comic) {
                    comics.push(comic)
                }
            }

            if (comics.length === 0) {

                let links = document.querySelectorAll("a")

                for (let a of links) {

                    let href = a.attributes["href"] || ""

                    if (href.indexOf("/album/") < 0) {
                        continue
                    }

                    let id = this.getId(href)

                    if (!id) {
                        continue
                    }

                    let title = a.text.trim()

                    if (!title) {
                        title = "Album " + id
                    }

                    let cover = ""
                    let img = a.querySelector("img")

                    if (img) {

                        let attrs = img.attributes

                        cover =
                            attrs["data-src"] ||
                            attrs["data-original"] ||
                            attrs["data-lazy-src"] ||
                            attrs["src"] ||
                            ""
                    }

                    comics.push({
                        id: id,
                        title: title,
                        cover: this.absoluteUrl(cover),
                        tags: [],
                        description: ""
                    })
                }
            }

            return {
                comics: comics,
                maxPage: comics.length === 0 ? page : null
            }
        },

        optionList: []
    }

    comic = {

        loadInfo: async (id) => {

            let ur
