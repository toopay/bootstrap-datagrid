/* ===================================================
 * bootstrap-datagrid.js v0.3.0
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
    this.$booted         = false
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

  , __setListener: function(force) {
      // Set editable routines
      if (this.$options.editable == true || !!force) {
        // Check for click on cell
        this.$table.find('td').on('click', $.proxy(this.__setEditableInput, this))

        // Detect window resize
        $(window).on('resize', $.proxy(this.__setEditableInput, this))
      }

      // Re-attach datagrid data
      this.$table.data('datagrid',this)

      return this
    }
  , __resetCellPadding: function(cell) {
      if (typeof cell != "undefined") {
        cell.css('padding', cell.data('padding'))
      }
    }

  , __resetEditorPadding: function(inputContainer, input) {
      var invoke = true
      if ((typeof inputContainer == "undefined" || typeof input == "undefined")
        && typeof this.$editor != "undefined") {
        input = this.$editor,
        inputContainer = input.el.parents('.datagrid-input-container')
        invoke = false
      }

      if (!!inputContainer && !!input) {
        inputContainer.css('position', 'absolute')
        inputContainer.css('z-index', 999)
        inputContainer.css('width', this.$cellDimension.width)
        inputContainer.css('height', this.$cellDimension.height)
        inputContainer.css('top', this.$cellOffset.top.toString+'px')
        inputContainer.css('left', this.$cellOffset.left.toString+'px')
        inputContainer.css('margin', 0)

        // Call the show event of the input
        if (invoke == true) {
          $.proxy(input.onShow, input.el, this.$cell)()
        } else {
          var currentValue = input.el.val()
          $.proxy(input.onShow, input.el, this.$cell)()
          input.el.val(currentValue)
        }
      }
    }

  , __commitEditorChange: function() {
      var parentCell = typeof this.$editor != "undefined" ? this.$editor.el.parents('td:eq(0)') : undefined

      if (!parentCell && typeof this.$cell != 'undefined') {
        parentCell = this.$cell
      }

      if (!!parentCell && typeof this.$editor != "undefined") {
        var isChanged = $.proxy(this.$editor.isChanged, this.$editor.el, parentCell)()

        if (!!this.$editor.el.val() && isChanged) {
          // Call the cell mutator
          $.proxy(this.$editor.onChange, this.$editor.el, parentCell)()
        }

        this.__resetCellPadding(parentCell)
      }
    }
  , __clearEditor: function() {
      var parentCell = typeof this.$editor != "undefined" ? this.$editor.el.parents('td:eq(0)') : undefined

      if (!parentCell && typeof this.$cell != 'undefined') {
        parentCell = this.$cell
      }

      if (!!parentCell && typeof this.$editor != "undefined") {
        // Reset cell padding
        this.__resetCellPadding(parentCell)
        
        parentCell.parents('table:eq(0)').find('.datagrid-input-container').remove()
        this.$editor = undefined
        this.$cell = undefined
      }
    }

  , __getCellInfo: function(e) {
      if (e.currentTarget.tagName == 'TD' || typeof this.$cell == 'undefined') {
        if (e.type == 'click' && 
          typeof this.$editor != 'undefined' && 
          typeof e.originalEvent != 'undefined' &&
          !$(e.currentTarget).is(this.$cell)) {
          // Trigger commit event for appropriate event
          if ($(document).data('active-datagrid') != "undefined" &&
            $(document).data('active-datagrid').$table.is(this.$table)) {

            this.commit().clean()
          } 
        } else {
          // Do not trigger full commit cycle
          this.__commitEditorChange()
          this.__resetCellPadding()
        }

        // Get current cell padding
        if (typeof $(e.currentTarget).data('editable') == "undefined" ||
          $(e.currentTarget).data('editable') == true) {
          if (typeof $(document).data('active-datagrid') != 'undefined' &&
            !$(document).data('active-datagrid').$table.is(this.$table) &&
            typeof $(document).data('active-datagrid').$editor != "undefined") {
            // Commit previous active datagrid before setting the new one
            $(document).data('active-datagrid').commit().clean()
          }

          // Set the document active table
          $(document).data('active-datagrid', this)

          this.$cell = $(e.currentTarget)
        }
      }

      if (!this.$cell && !!this.$editor) {
        this.$cell = this.$editor.el.parents('td:eq(0)')
      }

      if (!!this.$cell && this.$cell[0].tagName == 'TD') {
        // Reconfigure td padding
        this.__resetCellPadding(this.$cell)
        this.$cell.data('padding', this.$cell.css('padding'))

        this.$cell.css('padding', 0)

        // Set cell type, offset and dimension
        this.$cellType = !!this.$cell.data('type') && !!this.$inputs[this.$cell.data('type')]
                        ? this.$cell.data('type') : 'text'
        this.$cellOffset = this.$cell.offset()
        this.$cellDimension.width = this.$cell.width()
        this.$cellDimension.height = this.$cell.height()

        this.__resetEditorPadding()
      }

      return this
    }

  , __setEditableInput: function(e) {
      this.__getCellInfo(e)

      if (e.type == 'click' && 
          typeof e.originalEvent != 'undefined' &&
          !$(e.currentTarget).is(this.$cell)) {
        // Ignore invalid event
        e.preventDefault()
      } else if (this.$cell.data('editable') == false) {
        this.commit().clean()
        e.preventDefault()
      } else if (typeof this.$cell != "undefined" && this.$cell[0].tagName == 'TD'
        && e.type == 'click') {
        var input = this.$inputs[this.$cellType]
        var inputContainer = $('<div class="datagrid-input-container"><div class="datagrid-input-wrapper"></div></div>')

        // First of, destroy all known inputs and reset cell padding
        this.__clearEditor()

        // Attach selected input above the cell
        this.$cell.prepend(inputContainer)
        this.__resetEditorPadding(inputContainer, input)

        // Display the input
        inputContainer.find('.datagrid-input-wrapper').html(input.el)
        inputContainer.parents('td:eq(0)').css('padding', 0)

        input.el.focus()

        this.$editor = input
        this.$editor.el.on('keydown', $.proxy(this.__handleKeydown, this))
      }

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
            // Save previous cell before it being destroyed
            var previousCell = this.$cell

            // Commit and clear the editor
            this.commit().clean()

            // Activate the editor on next closest sibling
            var currentIndex = previousCell.index(),
                parentRow = previousCell.parents('tr:eq(0)'),
                nextRow = parentRow.next('tr'),
                nextCell = undefined


            // Loop through current row to get next available td
            parentRow.find('td').each(function(i,tdEl){
              if ($(tdEl).index() > currentIndex && 
                (typeof $(tdEl).data('editable') == "undefined" || $(tdEl).data('editable') == true)) {
                nextCell = $(tdEl)
                return false
              }
            })

            if (!nextCell && nextRow.length) {
              // Loop through next row to get next available td
              nextRow.find('td').each(function(i,tdEl){
                if (typeof $(tdEl).data('editable') == "undefined" || $(tdEl).data('editable') == true) {
                  nextCell = $(tdEl)
                  return false
                }
              })
            }

            if (nextCell) nextCell.click()

            blocked = true
            break

          case 13: // enter
            // Exit editing mode
            this.commit().clean()

            blocked = true
            break

          case 27: // escape
            this.clean()
            blocked = true
            break;

          default:
            blocked = false
        }

        if (blocked) {
          e.stopPropagation()
          e.preventDefault()
        }
      }
    }

  , boot: function(force) {
      if (this.$booted == false) {
        this.__setListener(force)
        this.$options.onBoot(this)
        this.$booted = true
      }

      return this
    }
  , commit: function() {
      this.$options.onCommit(this)
      this.__commitEditorChange()

      return this
    }
  , clean: function() {
      this.__clearEditor()
      this.$options.onClean(this)

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
    onBoot: function(datagrid) {},
    onCommit: function(datagrid) {},
    onClean: function(datagrid) {},
    inputs: {
      text: {
        el : $('<input type="text" class="form-control datagrid-input">'),
        onShow:function(cell) {
          var inputPadding = parseInt(cell.data('padding'))-1
          $(this).css('padding', inputPadding+'px')
          $(this).css('width', '100%')
          $(this).css('height', '100%')
          $(this).css('top', cell.offset().top.toString+'px')
          $(this).css('left', cell.offset().left.toString+'px')
          $(this).val(cell.text())
        },
        onChange:function(cell) {
          cell.text($(this).val())
        },
        isChanged:function(cell) {
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

    if ($this.data('datagrid')) return

    $this.datagrid()
  }


  $(document)
    .ready(function(){
      $('table[data-provide="datagrid"]').each(function(){
        initDatagrid($(this))
      })
    }).click(function(e) { 
      if (typeof $(this).data('active-datagrid') != 'undefined' && !$(e.target).closest('table').length) {
        // Only check if there is an active datagrid
        $(this).data('active-datagrid').commit().clean()
      }
    })

}(window.jQuery);