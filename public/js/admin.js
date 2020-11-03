const deleteProduct = (btn) =>{
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(result =>{
        if(result.status == 200){
            const parentElement = btn.closest('article');
            parentElement.parentNode.removeChild(parentElement);
        }
    })
    .catch(err => {
        console.log(err);
    });
}