<template>
  <b-card no-body no-header class="h-100 w-100 border-0 top-area">
    <b-form inline class="operation-area p-1 m-1 border-0">
      <b-button type="button" size="sm" @click="setScale(10)">
        <font-awesome-icon icon="plus" />
      </b-button>
      <b-button type="button" size="sm" class="ml-1" @click="setScale(-10)">
        <font-awesome-icon icon="minus" />
      </b-button>
      <div class="contents-number ml-1">
        {{ scale }}
      </div>
      <div class="ml-1 contents-label">
        %
      </div>
      <b-button type="button" size="sm" class="ml-4" @click="setPage(-1)">
        <font-awesome-icon icon="caret-left" />
      </b-button>
      <b-button type="button" size="sm" class="ml-1" @click="setPage(1)">
        <font-awesome-icon icon="caret-right" />
      </b-button>
      <div class="contents-number ml-1">
        {{ currPage }}
      </div>
      <div class="ml-1 contents-label">
        /
      </div>
      <div class="contents-number ml-1">
        {{ numPages }}
      </div>
    </b-form>

    <div ref="contentsArea" class="border-0 h-100 w-100 view-area">
      <div ref="canvasParent" class="canvas-parent h-100" :style="styles()">
        <canvas ref="contentsCanvas" />
      </div>
    </div>

    <transition name="fade">
      <loading-spinner v-show="loading" class="fade-area" />
    </transition>
  </b-card>
</template>

<script>
import LoadingSpinner from './loading-spinner';

export default {
  components: {
    'loading-spinner': LoadingSpinner
  },
  props: {
    content: {
      type: Object,
      required: true,
      validator(obj) {
        return (
          typeof obj.docId === 'string' &&
          typeof obj.docName === 'string' &&
          typeof obj.mimetype === 'string'
        );
      }
    }
  },
  data() {
    return {
      scale: 100,
      currPage: 1,
      numPages: 0,
      loading: false
    };
  },
  watch: {
    content(newVal, oldVal) {
      if (newVal !== null) {
        this.scale = 100;
        this.page = 1;
        this.render(1);
      }
    }
  },
  mounted() {
    this.render(1);
  },
  methods: {
    setScale(input) {
      this.scale += input;
      this.render(this.currPage);
    },
    setPage(input) {
      if (this.currPage + input > 0 && this.currPage + input <= this.numPages) {
        this.currPage += input;
        this.render(this.currPage);
      }
    },
    render(pageIndex) {
      const parent = this.$refs.canvasParent;
      const canvas = this.$refs.contentsCanvas;
      const context = canvas.getContext('2d');
      let numPages = 0;
      this.loading = true;
      this.$store
        .dispatch('repository/fetchPDF', {
          contentId: this.content.docId
        })
        .then(pdf => {
          numPages = pdf.numPages;
          return pdf.getPage(pageIndex);
        })
        .then(page => {
          const pWidth = parent.clientWidth;
          const orgViewport = page.getViewport(1);
          const x1 = pWidth / orgViewport.width;
          const viewport = page.getViewport((x1 * this.scale) / 100);
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          return page.render({
            canvasContext: context,
            viewport: viewport
          });
        })
        .then(() => {
          this.numPages = numPages;
          this.loading = false;
        })
        .catch(error => {
          this.$nuxt.$emit('showError', error);
          this.loading = false;
        });
    },
    styles() {
      const contentsArea = this.$refs.contentsArea;
      let retVal = null;
      if (contentsArea != null) {
        retVal = { height: contentsArea.clientHeight + 'px' };
      } else {
        retVal = { height: 450 + 'px' };
      }
      return retVal;
    }
  }
};
</script>

<style scoped>
.top-area {
  position: relative;
}
.operation-area {
  position: absolute;
  z-index: 1;
  background-color: rgba(240, 240, 240, 0.7);
  border-radius: 5px;
}
.view-area {
  position: absolute;
}
.contents-number {
  font-size: 17px;
  text-align: center;
  border: thin solid gray;
  width: 40px;
  border-radius: 5px;
  background-color: white;
}
.contents-label {
  font-size: 20px;
}
.canvas-parent {
  overflow: scroll;
  background-color: lightgray;
}
.fade-area {
  position: absolute;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 2s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
@media screen and (max-width: 768px) {
  .top-area {
    position: relative;
  }
  .operation-area {
    position: relative;
    z-index: initial;
    background-color: rgba(240, 240, 240, 0.7);
    border-radius: 2px;
  }
  .view-area {
    position: relative;
  }
}
</style>
