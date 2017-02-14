<template>
    <div class="page-container">
      <PageContent></PageContent>
    </div>
</template>


<script>

import PageContent from '../components/PageContent.vue';

export default {
  data () {
    return {
      msg: 'lorem ipsum'
    }
  },
  components: {
    PageContent
  }
}
</script>