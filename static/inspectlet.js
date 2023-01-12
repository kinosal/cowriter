let debug = document.getElementsByName("debug")[0].content;
if (debug === "False") {
    window.__insp = window.__insp || [];
    __insp.push(['wid', 593431300]);
    var ldinsp = function() {
        if(typeof window.__inspld != "undefined") return;
        window.__inspld = 1;
        var insp = document.createElement('script');
        insp.type = 'text/javascript';
        insp.async = true;
        insp.id = "inspsync";
        insp.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://cdn.inspectlet.com/inspectlet.js?wid=593431300&r=' + Math.floor(new Date().getTime()/3600000);
        var x = document.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(insp, x);
    }
    setTimeout(ldinsp, 0);
}