console.log('tilmap.js loaded')

tilmap=function(){
    // ini
    tilmap.div=document.body.querySelector('#tilmapDiv')
    tilmap.div.hidden=true
    if(tilmap.div){
        tilmap.homeUI()
        tilmap.ui()
        // make sure first image is onloaded
        function firstLoad(){
            if(!document.getElementById('calcTILblue')){
                console.log('1st Load at '+Date())
                setTimeout(firstLoad,1000)
            }else{
                tilmap.img.onload()
                if(location.hash.length>3){
                    var ts = location.hash.slice(1).split('/')
                    setTimeout(function(){
                        tilmap.selTumorType.value=ts[0]
                        tilmap.selTumorType.onchange()
                        setTimeout(function(){
                            tilmap.selTumorTissue.value=ts[1]
                            tilmap.selTumorTissue.onchange()
                        },1000)

                        //debugger
                    },0)
                    //debugger
                }
            }
        }
        firstLoad()
        loading.hidden=true
        continueTool.style.backgroundColor="yellow"
        continueTool.style.color="red"
        //debugger
    }
}

tilmap.parms={ // starting defaults
    cancerRange:100,
    tilRange:100,
    transparency:20,
    threshold:0
}

tilmap.ui=function(div){
    div=div||tilmap.div // default div
    
    h='<table><tr><td style="vertical-align:top">'
    h+='<h3 style="color:maroon">Interactive Pathomics Tissue Analytics<span id="slideLink" style="color:blue;font-size:small;cursor:pointer">Link</span></h3>'
    h+='<p style="font-size:small">This tool is designed to let users explore cancer immunopathology and evaluate algorithmic performance. The panels in the left column are generated with deep learning and computer vision to identify tumor immune interactions in cancer tissue samples. Each pixel in the left panels represents a tiled patch classified as tumor, lymphocyte, or type of histologic growth pattern in the whole slide image (WSI) on the right. Clicking the left image will navigate to the corresponding patch in the WSI (link to YouTube above demonstrates interactive exploration of WSIs).</p>'
    h+='<br><input id="searchInput" value="search" style="color:gray"> <span id="searchResults" style="font-size:small">...</span>'
    h+='<br>from tumor type <select id="selTumorType"></select> select tissue <select id="selTumorTissue"></select>'


    h+='<div id="tilShowImgDiv"></div></td>'
    h+='<td style="width: 700px; height: 500px; max-width: 700px; max-height: 500px; vertical-align:top">'
    h+='<p style="font-size:small;position:fixed">* Tumor patches(350x350 pixels) and lymphocyte patches(200x200 pixels) corresponding to 88 um and 50 um resolution at 400x magnification</p>'
    h+='<div id="Micro"><iframe id="caMicrocopeIfr" width="55%" height="80%" style="position:fixed; top:18%;left:auto">'
    h+='</div></td></tr></div></table>'

    
    div.innerHTML=h
    tilmap.selTumorType=div.querySelector('#selTumorType')
    tilmap.selTumorTissue=div.querySelector('#selTumorTissue')
    tilmap.tilShowImgDiv=div.querySelector('#tilShowImgDiv')
    tilmap.selTumorType.style.backgroundColor='lime'
    tilmap.selTumorTissue.style.backgroundColor='orange'
    tilmap.getJSON().then(x=>{
        tilmap.index(x) // build TissueIndex
        for(var t in tilmap.tumorIndex){
            var op = document.createElement('option')
            tilmap.selTumorType.appendChild(op)
            op.textContent=t


            //debugger
        }
        tilmap.optTissue()
        tilmap.showTIL()
    })
    tilmap.selTumorType.onchange=()=>{ // update tissue list
        tilmap.optTissue();
        tilmap.showTIL();
        Micro.parentElement.removeChild(w)
    }


    tilmap.selTumorTissue.onchange=tilmap.showTIL
    
    //tilmap.selTumorType.onclick=tilmap.selTumorTissue.onclick=function(){
      //  if(cancerRangePlay.style.backgroundColor=="orange"){
        //    cancerRangePlay.click()

    //    }
    //    if(tilRangePlay.style.backgroundColor=="orange"){
    //        tilRangePlay.click()
    //    }
        // Micro.parentElement.removeChild(w)
        //debugger
    //}
    
    //setTimeout(tilmap.showTIL,3000)
    searchInput.onkeyup=searchInput.onclick=tilmap.search
    /*
    if(location.hash.length>3){
        var ts = location.hash.slice(1).split('/')
        setTimeout(function(){
            tilmap.selTumorType.value=ts[0]
            tilmap.selTumorType.onchange()
            setTimeout(function(){
                tilmap.selTumorTissue.value=ts[1]
                tilmap.selTumorTissue.onchange()
            },0)

            //debugger
        },1000)
        //debugger
    }
    */
    
    slideLink.onclick=function(){
        location.hash=`${location.hash=tilmap.selTumorType.value}/${tilmap.selTumorTissue.value}`
        tilmap.copyToClipboard(location.href)
    }

    var n=0
    var t = setInterval(_=>{
        n=n+1 
        //console.log('initial check '+n)
        if((document.querySelectorAll('#cvTop').length>1)&(document.querySelectorAll('#cvBase').length>1)){
            selTumorTissue.onchange()
            //document.querySelectorAll('#cvTop')[1].remove()
            //document.querySelectorAll('#cvBase')[1].remove()
            //tilmap.canvasAlign()
        }
        if(n>30){clearInterval(t)}
    },1000)


}

tilmap.search=function(){
    if(this.style.color=="gray"){
        this.style.color="navy"
        this.value=""
    }else{
        if(this.value.length>2){
            var res=[] // results
            for(let t in tilmap.tumorIndex){
                for(let s in tilmap.tumorIndex[t]){
                    if(s.match(RegExp(this.value,'i'))){
                        res.push(`<a href="#${t}/${s}" target="_blank">${t}/${s.replace('.png','')}</a>`)
                    }
                    //debugger
                }
            }
            if(res.length>0){
                searchResults.innerHTML=res.join(', ')
            }else{
                searchResults.innerHTML=' no matches'
            }
            tilmap.canvasAlign()
        }

    }
    //debugger
}

tilmap.copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  slideLink.textContent='Link copied'
  setTimeout(function(){
      slideLink.textContent='Link'
  },1000)
};

tilmap.optTissue=function(){ // fill Tissues once type is chosen
    tilmap.selTumorTissue.innerHTML="" // reset options
    for(var c in tilmap.tumorIndex[tilmap.selTumorType.value]['thumbnail']){
        var op = document.createElement('option')
        op.textContent=c
        tilmap.selTumorTissue.appendChild(op)
    }
    //debugger
}

tilmap.getJSON=async function(url){
    url=url||'dir.json'
    return (await fetch(url)).json()
}

tilmap.index=function(x){
    tilmap.tissueIndex={}
    tilmap.tumorIndex=x.PNGs
    for(var t in tilmap.tumorIndex){
        //tilmap.tissueIndex[c]={} // tumor type
        console.log('indexing '+t)

        for(var c in tilmap.tumorIndex[t]['thumbnail']){

            tilmap.tissueIndex[c]=t // indexing tissue c to tumor type t
        }
    }
    return tilmap.tissueIndex
}

tilmap.showTIL=function(){ // get image and display it
    var url_2='PNGs/'+tilmap.selTumorType.value+'/thumbnail/'+tilmap.selTumorTissue.value
    var url_3='PNGs/'+tilmap.selTumorType.value+'/cancer/'+tilmap.selTumorTissue.value
    var url_4='PNGs/'+tilmap.selTumorType.value+'/til/'+tilmap.selTumorTissue.value
    var url_1 ='PNGs/'+tilmap.selTumorType.value+'/mergedMap/'+tilmap.selTumorTissue.value
    var h='<div id="imgTILDiv"><br>'


    h+='<h4>Tumor-TILs</h><img id="imgTIL1" src='+url_1+'>'
    if(selTumorType.value =='luad'){
        h += '<br><br><span style="font-size:small;background-color:red;color:black">&nbsp;Lepidic&nbsp;</span>'
        + '<span style="font-size:small;background-color:blue;color:white">&nbsp;Benign&nbsp;</span>'
        +'<span style="font-size:small;background-color:orange;color:black">&nbsp;Acinar&nbsp;</span>'
        +'<span style="font-size:small;background-color:yellow;color:black">&nbsp;Micropap&nbsp;</span>'
        +'<span style="font-size:small;background-color:green;color:black">&nbsp;Mucinous&nbsp;</span>'
        +'<span style="font-size:small;background-color:pink;color:black">&nbsp;Solid&nbsp;</span>'
    }else if(selTumorType.value=='paad' || 'prad'){
        h += '<span style="font-size:small;background-color:gray;color:white">&nbsp;T&nbsp;</span><span style="font-size:small;background-color:yellow;color:black">&nbsp;C&nbsp;</span><span style="font-size:small;background-color:red;color:black">&nbsp;L&nbsp;</span>'       
    }
    h += '<h4>Histologic Growth Pattern</h><img id="imgTIL2" src='+url_2+'><br>'


    h += '<h4>Probability of Tumor</h><img id="imgTIL2" src='+url_3+'><br>'

    h += '<h4>Probability of Lymphocyte</h><img id="imgTIL3" src='+url_4+'></div><div><a href="'+url_1+'" target="_blank">'+url_1+'</a></div>'
    
    //针对3class的标签
    if(selTumorType.value=="prad"){
        h += '<span style="font-size:small;background-color:green;color:black">&nbsp;G3&nbsp;</span>'
        + '<span style="font-size:small;background-color:orange;color:black">&nbsp;G4+5&nbsp;</span>'
        +'<span style="font-size:small;background-color:blue;color:white">&nbsp;Begnin&nbsp;</span>'
    }

    //根据不同的cancer type，显示不同的标签


 
    tilmap.tilShowImgDiv.innerHTML=h
    
    tilmap.tilShowImgDiv.style.color='navy'
    var dt=tilmap.tumorIndex[tilmap.selTumorType.value][tilmap.selTumorTissue.value]

    // Set iFrame src
    let url2;
    if (obfuscatedId)
    {
        tilmap.getSlideData(tilmap.selTumorTissue.value.replace('.png','')).then(x => {
            url2='/viewer.html?slideId='+x[0]['_id']['$oid']
            caMicrocopeIfr.src=url2
        })
    }
    else
    {
        url2='https://quip1.bmi.stonybrook.edu/camicroscope/osdCamicroscope.php?tissueId='+tilmap.selTumorTissue.value.replace('.png','')
        if(!tilmap.selTumorTissue.value.match('-')){ // to accommodate Han's new slides
            let id = tilmap.selTumorTissue.value.match(/\d+/)[0]
            url2="https://quip3.bmi.stonybrook.edu/camicroscope/osdCamicroscope.php?tissueId="+id
        }
        caMicrocopeIfr.src=url2
    }
    //var url2='http://quip1.uhmc.sunysb.edu:443/camicroscope/osdCamicroscope.php?tissueId='+tilmap.selTumorTissue.value.replace('.png','')


    var imgTILDiv = document.getElementById('imgTILDiv')
    var Micro = document.getElementById('Micro')  
    tilmap.zoom2loc()

}

//在micro上画框
function drawfoc(){   
    w = document.createElement("canvas");
    ctx = w.getContext("2d");
    //ctx.clearRect(0,0,100,100);
    //ctx.fillRect(50,50,10,10)
    m = document.getElementById("caMicrocopeIfr");
    var box = m.getBoundingClientRect()

    l = (box.left + box.right) / 2;
    t = (box.top + box.bottom) / 2;


    w.style="position:fixed;left:66%;top:48%;border:3px solid yellow;width:150px;height:150px;z-index:100000;pointer-events:none;";
 //   w.style.top = t-40;
//    w.style.left = l-50;
    Micro.parentElement.appendChild(w);
}




tilmap.zoom2loc=function(){ // event listener pointing to zoom2loc's code
    imgTILDiv.onclick=function(ev){
    //tilmap.img.onclick=function(ev){
        if(typeof(zoom2loc)=="undefined"){
            var s=document.createElement('script')
            s.src="zoom2loc.js"
            //if(location.pathname.match('tilmap')){
            //   s.src="zoom2loc.js"
            //}else{
            //   s.src="https://yujiexiao.github.io/tcgatil/zoom2loc.js"  /*用于zoom的超链接，如果有需要，改到特定的网址即可*/
            //}
            //s.src = "zoom2loc.js"
            
            s.onload=function(){zoom2loc(ev)}
            document.head.appendChild(s)
        }else{zoom2loc(ev)}
        drawfoc()
    }
}

tilmap.homeUI=function(){
    var h = '<h3 style="color:maroon"> Tumor Infitrating Lynphocytes (TILs)</h3>'
    h += '<p style="color:navy">'
    h += 'Tumor formation requires evading the surveillance of the patient\'s own immune system.'
    h += ' As such, the visualization of the immune response mediated by Lymphocytes has an important prognostic value for the understanding and treatment of cancer.'
    h += ' To that end, large collaboratory initiatives like <a href="https://www.tilsinbreastcancer.org" style="background-color:yellow" target="_blank">tilsinbreastcancer.org</a> bring together distributed efforts to analyse and classify histopathology slides, each with up to a million individual cells.'
    h += '</p>'
    h += '<h3 style="color:maroon"> Deep Learning (AI)</h3>'
    h += '<p style="color:navy;font-family:Arial;font-size:16px">'
    h += '<i>Deep Learning</i>, an Artificial Intelligence (AI) technique, was used here to scale and automate the laborious TIL and cancer cell classification by Pathologists.'
    h += ' This web-based tool provides an interface with tissue images synthesized from the AI predictions, which can be interactivelly mapped to the raw images they classify.'
    h += ' The result is a collection of 1015 breast cancer whole slide images and their respective synthetic AI maps.'
    h += ' The slide images come from the public <a href="https://www.cancer.gov/about-nci/organization/ccg/research/structural-genomics/tcga" style="background-color:yellow" target="_blank">The Cancer Genome Atlas</a> (TCGA), and the AI calssification image maps are similarly made publicly available with this tool.'
    h += ' To use the interactive tool where AI classifications are mapped to whole slides of breast tumors <button id="continueTool" style="background-color:silver;color:gray;font-size:large;vertical-align:top;border-radius:15px">Click to see TIL/tumor maps</button>'
    h += '</p>'
    h += '<hr>'
    h += '<p style="font-size:small">'
    h += 'For more information and methodological detail see published manuscript:'
    h += '</p>'
    h += '<p style="font-size:small">'
    h += '<i>Han Le, Rajarsi Gupta, Le Hou, Shahira Abousamra, Danielle Fassler, Tahsin Kurc, Dimitris Samaras, Rebecca Batiste, Tianhao Zhao, Alison L. Van Dyke, Ashish Sharma, Erich Bremer, Jonas S Almeida, Joel Saltz (2020) <b>Utilizing Automated Breast Cancer Detection to Identify Spatial Distributions of Tumor Infiltrating Lymphocytes in Invasive Breast Cancer</b>. Am J. Pathol. (20)30188-7. [<a href="https://pubmed.ncbi.nlm.nih.gov/32277893" target="_blank" style="background-color:yellow">PMID:32277893</a>].'
    h += '</p>'
    tilmap.homeDiv=document.getElementById('tilmapHome')
    tilmap.homeDiv.innerHTML=h
    tilmap.homeDiv.style.fontFamily="Arial"
    continueTool.onclick=function(){
        tilmap.div.hidden=false
        tilmap.homeDiv.hidden=true
        setTimeout(tilmap.canvasAlign,100)
    }
}


window.onload=tilmap


// MIS

tilmap.getRelative = async function(id,xy){ // converts relative to absolute coordinates
    var url='https://quip1.bmi.stonybrook.edu:443/camicroscope/api/Data/getImageInfoByCaseID.php?case_id='+id
    return (await fetch(url)).json().then(info=>[xy[0]*info[0].width,xy[1]*info[0].height].map(c=>parseInt(c)))
}

const obfuscatedId = false;
tilmap.getSlideData = async function (slide) {
    url = '/data/Slide/find?slide=' + slide;
    return (await fetch(url)).json()
};

// wiring links teh the header to where the application is
ioUrl.href=location.href
codeSource.href='https://github.com/mathbiol'+location.pathname


