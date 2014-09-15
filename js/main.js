$(function(){
	$('#datagrid-triger-init').click(function(){
		$('#target-table').datagrid({
			editable:true,
			onBoot: function(e){
				alert('Booting '
				+e.$table.prop('tagName').toLowerCase()
				+'#'
				+e.$table.attr('id')
				+' as Datagrid ...')
			},
			onCommit: function(e) {
				if (e.$editor) {
					alert('Commiting "'+e.$editor.el.val()+'"...')
				}
			},
			onClean: function(e) {
				alert('Clean triggered!')
			}
		})
	})
})