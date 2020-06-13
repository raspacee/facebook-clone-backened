
function removeElement(array, element){
    index = array.indexOf(element);
    array.splice(index, 1);
    return array;
}

module.exports = removeElement;

