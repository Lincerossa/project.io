<template>
    <nav>
      <ul>
        <li class="[ col-xs-2 ]" v-for="item in items">

          <a :href='item.link'>{{ item.text }}</a>

          <ul>
            <li v-for="item in item.subMenu">
              <a :href='item.subLink'>{{ item.subText }}</a>
            </li>
          </ul>

        </li>      
      </ul>
    </nav>
</template>

<script>
export default {
  data () {
    return {
      items: [
        { 
          link:'http://www.prestiti.supermoney.eu', 
          text: 'Prestiti',
          subMenu: [
            { 
              subLink: 'http://www.prestiti.supermoney.eu/prestiti-online/', 
              subText:"prestiti sub1"  
            },

            { 
              subLink: 'http://www.prestiti.supermoney.eu/prestiti-online/', 
              subText:"prestiti sub2"  
            },

            { 
              subLink: 'http://www.prestiti.supermoney.eu/prestiti-online/', 
              subText:"prestiti sub3"  
            }
          ]
        },

        { 
          link:'http://www.energia.supermoney.eu', 
          text: 'Energia',
          subMenu: [
            { 
              subLink: 'http://www.energia.supermoney.eu/energia-online/', 
              subText:"energia sub1"  
            },

            { 
              subLink: 'http://www.energia.supermoney.eu/energia-online/', 
              subText:"energia sub2"  
            },

            { 
              subLink: 'http://www.energia.supermoney.eu/energia-online/', 
              subText:"energia sub3"  
            },
            { 
              subLink: 'http://www.energia.supermoney.eu/energia-online/', 
              subText:"energia sub4"  
            },           
          ]
        },

        { 
          link:'http://www.mutui.supermoney.eu', 
          text: 'Mutui' 
        },

        { 
          link:'http://www.telefonia.supermoney.eu', 
          text: 'Telefonia' 
        },

        { 
          link:'http://www.assicurazione-auto.supermoney.eu', 
          text: 'Assicurazione auto' 
        },

        { 
          link:'http://www.paytv.supermoney.eu', 
          text: 'Pay Tv' 
        },
      ]
    }
  }
}
</script>

<style scoped lang="less">

nav{
  border: 1px solid #505050;
  height: 60px;
  background-color: #f5f5f5;

  ul{
    list-style:none;
    height: 100%;
    margin: 0;
    padding: 0;
    li{

      float:left;
      
      a{
        text-align:center;
        width: 100%;
        display: block;
        border: 1px solid #505050;
      }
    }
  }


}

</style>