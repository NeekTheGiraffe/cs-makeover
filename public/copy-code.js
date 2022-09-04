$('.copy-btn').on('click', function(e) {
    const number = $(this).attr('id').substring(4); // id is something like: btn-4
    const copyText = $(`#blk-${number}`).text();
    navigator.clipboard.writeText(copyText);
    //console.log(`Copied the text: ${copyText}`);
});