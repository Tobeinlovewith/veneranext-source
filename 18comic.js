class ComicSource18Comic extends ComicSource {
    name = "18Comic";
    key = "18comic.vip";
    version = "1.0.0";
    minAppVersion = "1.16.0";
    url = "https://raw.githubusercontent.com/Tobeinlovewith/veneranext-source/main/18comic.js";

    baseUrl = "https://18comic.vip";

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Referer": "https://18comic.vip/"
    };

    async request(url) {
        let res = await Network.get(url, this.headers);

        if (res.status !== 200) {
            throw "HTTP " + res.status;
        }

        return res;
    }

    absoluteUrl(url) {
        if (!url) return "";

        if (url.startsWith("//")) {
            return "https:" + url;
        }

        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }

        if (url.startsWith("/")) {
            return this.baseUrl + url;
        }

        return this.baseUrl + "/" + url;
    }

    getId(url) {
        if (!url) return "";

        let m = url.match(/\/(?:album|photo)\/(\d+)/);
        if (m) return m[1];

        let m2 = url.match(/(\d+)/);
        return m2 ? m2[1] : "";
    }

    parseComic(element) {
        let a = element.querySelector("a");

        if (!a) return null;

        let href = a.attributes["href"] || "";
        let id = this.getId(href);

        if (!id) return null;

        let title = element.text.trim();

        let img = element.querySelector("img");

        let cover = "";

        if (img) {
            let attrs = img.attributes;

            cover =
                attrs["data-src"] ||
                attrs["data-original
    search = {
        load: async (keyword, options, page) => {
            let url =
                this.baseUrl +
                "/search/photos?main_tag=0" +
                "&search_query=" +
                encodeURIComponent(keyword) +
                "&search-type=photos" +
                "&page=" +
                page;

            let res = await this.request(url);

            let document = new HtmlDocument(res.body);

            let comics = [];

            let elements = document.querySelectorAll(
                "div.gallery, div.photo-list, div.list-item, .gallary_item"
            );

            for (let element of elements) {
                let comic = this.parseComic(element);

                if (comic) {
                    comics.push(comic);
                }
            }

            if (comics.length === 0) {
                let links = document.querySelectorAll("a");

                for (let a of links) {
                    let href = a.attributes["href"] || "";

                    if (href.indexOf("/album/") >= 0) {
                        let id = this.getId(href);

                        if (!id) continue;

                        let title = a.text.trim();

                        let img = a.querySelector("img");
                        let cover = "";

                        if (img) {
                            let attrs = img.attributes;

                            cover =
                                attrs["data-src"] ||
                                attrs["data-original"] ||
                                attrs["src"] ||
                                "";
                        }

                        cover = this.absoluteUrl(cover);

                        comics.push({
                            id: id,
                            title: title || ("Album " + id),
                            cover: cover,
                            tags: [],
                            description: ""
                        });
                    }
                }
            }

            return {
                comics: comics,
                maxPage: comics.length === 0 ? page : null
            };
        },

        optionList: []
    };

    comic = {
        loadInfo: async (id) => {
            let url = this.baseUrl + "/album/" + id + "/";

            let res = await this.request(url);

            let document = new HtmlDocument(res.body);

            let titleElement =
                document.querySelector("h1") ||
                document.querySelector(".title");

            let title = titleElement
                ? titleElement.text.trim()
                : ("Album " + id);

            let cover = "";

            let coverImg =
                document.querySelector(".cover img") ||
                document.querySelector(".album-cover img") ||
                document.querySelector("img");

            if (coverImg) {
                let attrs = coverImg.attributes;

                cover =
                    attrs["data-src"] ||
                    attrs["data-original"] ||
                    attrs["src"] ||
                    "";

                cover = this.absoluteUrl(cover);
            }

            let description = "";

            let desc =
                document.querySelector(".description") ||
                document.querySelector(".desc") ||
                document.querySelector("meta[name='description']");

            if (desc) {
                description =
                    desc.attributes["content"] ||
                    desc.text.trim();
            }

            let tags = [];

            for (let e of document.querySelectorAll(
                ".tags a, .tag a, a[href*='tag']"
            )) {
                let t = e.text.trim();

                if (t && !tags.includes(t)) {
                    tags.push(t);
                }
            }

            let chapters = new Map();

            let chapterIndex = 0;

            for (let a of document.querySelectorAll("a")) {
                let href = a.attributes["href"] || "";

                if (href.indexOf("/photo/") >= 0) {
                    let chapterId = this.getId(href);

                    if (!chapterId) continue;

                    let chapterTitle = a.text.trim();

                    if (!chapterTitle) {
                        chapterTitle = "Chapter " + (chapterIndex + 1);
                    }

                    chapters.set(
                        chapterId,
                        chapterTitle
                    );

                    chapterIndex++;
                }
            }

            return {
                title: title,
                cover: cover,
                description: description,
                tags: {
                    "标签": tags
                },
                chapters: chapters
            };
        },
              loadEp: async (comicId, epId) => {
            let url =
                this.baseUrl +
                "/photo/" +
                epId +
                "/?read_mode=read-by-page";

            let res = await this.request(url);

            let document = new HtmlDocument(res.body);

            let images = [];

            let elements = document.querySelectorAll(
                ".owl-carousel-page .center img"
            );

            for (let img of elements) {
                let attrs = img.attributes;

                let src =
                    attrs["data-src"] ||
                    attrs["data-original"] ||
                    attrs["data-lazy-src"] ||
                    attrs["src"] ||
                    "";

                if (!src) continue;

                src = this.absoluteUrl(src);

                if (!images.includes(src)) {
                    images.push(src);
                }
            }

            if (images.length === 0) {
                let imgs = document.querySelectorAll("img");

                for (let img of imgs) {
                    let attrs = img.attributes;

                    let src =
                        attrs["data-src"] ||
                        attrs["data-original"] ||
                        attrs["data-lazy-src"] ||
                        attrs["src"] ||
                        "";

                    if (!src) continue;

                    if (
                        src.indexOf("18comic") >= 0 ||
                        src.indexOf("jmcomic") >= 0 ||
                        src.indexOf("image") >= 0
                    ) {
                        src = this.absoluteUrl(src);

                        if (!images.includes(src)) {
                            images.push(src);
                        }
                    }
                }
            }

            return {
                images: images
            };
        }
    };

    comicDetails = {
        loadInfo: async (id) => {
            return await this.comic.loadInfo(id);
        }
    };
              link = {
        domains: [
            "18comic.vip"
        ],

        linkToId: (url) => {
            if (!url) return null;

            let m = url.match(
                /https?:\/\/(?:www\.)?18comic\.vip\/(?:album|photo)\/(\d+)/
            );

            return m ? m[1] : null;
        }
    };

    imageRequest = (url) => {
        return {
            url: url,
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Referer": "https://18comic.vip/"
            }
        };
    };

    init() {
    }
}

ComicSource.sources["18comic.vip"] =
    new ComicSource18Comic();
