import test from './test'
import imgUrl from '../assets/cat.jpg'

const el = document.getElementById('app')
el.innerHTML = test

document.getElementById('cat-img').src = imgUrl
