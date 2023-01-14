if (debug === "False") {
    let google_tag = document.createElement('script');
    google_tag.async = true;
    google_tag.src = 'https://www.googletagmanager.com/gtag/js?id=G-C2TBNVYYV6';
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(google_tag, x);
    // document.head.insertBefore(google_tag, document.getElementsByTagName('script')[0]);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-C2TBNVYYV6');
}