/* ===================================================
 * bootstrap-datagrid.js v1.0.0
 * http://github.com/toopay/bootstrap-datagrid
 * ===================================================
 * Copyright 2013-2014 Taufan Aditya
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

!function ($) {

  "use strict"; // jshint ;_;


  /* DATAGRID CLASS DEFINITION
   * ========================== */

  var Datagrid = function (element, options) {
    // Class Properties
    this.$ns             = 'bootstrap-datagrid'
    this.$table          = $(element)
    this.$options        = $.extend(true, {}, $.fn.datagrid.defaults, options, this.$table.data(), this.$table.data('options'))
    this.$inputs         = $.extend(true, {}, $.fn.datagrid.defaults.inputs, options.inputs)
    this.$editor         = undefined
    this.$cell           = undefined
    this.$cellType       = 'text'
    this.$cellOffset     = undefined
    this.$cellDimension  = {width:0,height:0}

    this.boot()
  }

  Datagrid.prototype = {

    constructor: Datagrid

  , __setListener: function() {
      // Set editable routines
      if (this.$options.editable == true) {
        this.$table.find('td').on('click', $.proxy(this.__setEditableInput, this))
        $(window).on('resize', $.proxy(this.__setEditableInput, this))
      }

      // Re-attach datagrid data
      this.$table.data('datagrid',this)

      return this
    }
  , __commitEditorChange: function() {
      var isChange = $.proxy(this.$editor.isChange, this.$editor.el, this.$cell)()

      if (!!this.$editor.el.val() && isChange) {
        // Call the cell mutator
        $.proxy(this.$editor.onChange, this.$editor.el, this.$cell)()
      }
      
      // Reset cell padding
      this.$cell.css('padding', this.$cell.data('padding'))
    }
  , __clearEditor: function() {
      $('.datagrid-input-container').remove()
    }

  , __getCellInfo: function(e) {
      if (e.currentTarget.tagName == 'TD' || typeof this.$cell == 'undefined') {
        if (typeof this.$cell != 'undefined') {
          this.__commitEditorChange()
        }

        // Get current cell padding
        this.$cell = $(e.currentTarget)
        this.$cell.data('padding', this.$cell.css('padding'))
        this.$cell.css('padding', 0)
      }

      // Set cell type, offset and dimension
      this.$cellType = !!this.$cell.data('type') && !!this.$inputs[this.$cell.data('type')]
                      ? this.$cell.data('type') : 'text'
      this.$cellOffset = this.$cell.offset()
      this.$cellDimension.width = this.$cell.width()
      this.$cellDimension.height = this.$cell.height()

      return this
    }

  , __setEditableInput: function(e) {
      this.__getCellInfo(e)

      var input = this.$inputs[this.$cellType]
      var inputContainer = $('<div class="datagrid-input-container"><div class="datagrid-input-wrapper"></div></div>')

      // First of, destroy all known inputs and reset cell padding
      this.__clearEditor()

      // Attach selected input above the cell
      this.$cell.prepend(inputContainer)
      inputContainer.css('position', 'absolute')
      inputContainer.css('z-index', 999)
      inputContainer.css('width', this.$cellDimension.width)
      inputContainer.css('height', this.$cellDimension.height)
      inputContainer.css('top', this.$cellOffset.top.toString+'px')
      inputContainer.css('left', this.$cellOffset.left.toString+'px')
      inputContainer.css('margin', 0)

      input.el.css('width', '100%')
      input.el.css('height', '100%')
      input.el.css('top', this.$cellOffset.top.toString+'px')
      input.el.css('left', this.$cellOffset.left.toString+'px')

      inputContainer.find('.datagrid-input-wrapper').html(input.el)

      $.proxy(input.onShow, input.el, this.$cell)()
      input.el.focus()
      this.$editor = input
      this.$editor.el.on('keydown', $.proxy(this.__handleKeydown, this))

      return this
    }

  , __handleKeydown: function(e) {
      if (typeof this.$editor.keydown == 'function') {
        this.$editor.keydown(e)
      } else {
        var blocked
        switch(e.keyCode) {
          case 40: // down arrow
          case 38: // up arrow
          case 16: // shift
          case 17: // ctrl
          case 18: // alt
            blocked = false
            break

          case 9: // tab
            // Commit and clear the editor
            this.__commitEditorChange()
            this.__clearEditor()

            // Activate the editor on next closest sibling
            var nextCell = this.$cell.next('td')
            if (nextCell.length == 0) {
              nextCell = this.$cell.parents('tr:eq(0)').next('tr').find('td').first()
            }
            if (nextCell) nextCell.click()

            blocked = true
            break

          case 13: // enter
          case 27: // escape
            // Exit editing mode
            this.__commitEditorChange()
            this.__clearEditor()

            blocked = true
            break

          default:
            blocked = false
        }

        if (blocked) {
          e.stopPropagation()
          e.preventDefault()
        }
      }
    }

  , boot: function() {
      this.__setListener()

      return this
    }
  }

 /* DATAGRID PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.datagrid

  $.fn.datagrid = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('datagrid')
        , options = typeof option == 'object' && option
      if (!data) $this.data('datagrid', (data = new Datagrid(this, options)))
    })
  }

  $.fn.datagrid.messages = {}

  $.fn.datagrid.defaults = {
    /* Table Properties */
    editable:true,
    inputs: {
      text: {
        el : $('<input type="text" class="form-control datagrid-input">'),
        onShow:function(cell) {
          $(this).val(cell.text())
        },
        onChange:function(cell) {
          cell.text($(this).val())
        },
        isChange:function(cell) {
          return $(this).val() != cell.text()
        }
      }
    }
  }

  $.fn.datagrid.Constructor = Datagrid


 /* DATAGRID NO CONFLICT
  * ==================== */

  $.fn.datagrid.noConflict = function () {
    $.fn.datagrid = old
    return this
  }

  /* DATAGRID GLOBAL FUNCTION & DATA-API
  * ==================================== */
  var initDatagrid = function(el) {
    var $this = el

    if ($this.data('datagrid')) {
      $this.data('datagrid').boot()
      return
    }

    $this.datagrid()
  }


  $(document)
    .ready(function(){
      $('table[data-provide="datagrid"]').each(function(){
        initDatagrid($(this))
      })
    })

}(window.jQuery);
