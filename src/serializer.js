
module.exports = {
    /**
     * @param data {object}
     * @return {string}
     */
    urlEncoded: function(data) {
        return Object.entries(data).map(entry => {
            const [key, value] = entry;
            return `${key}=${encodeURIComponent(value)}`;
        }).join("&");
    }
}
