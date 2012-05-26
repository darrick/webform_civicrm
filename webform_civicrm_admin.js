/**
 * Javascript Module for managing the webform_civicrm admin form.
 */

var wfCiviAdmin = (function ($, D) {
  /**
   * Public methods.
   */
  var pub = {};

  pub.selectReset = function (op, id) {
    var context = $(id);
    switch (op) {
      case 'all':
        $('input:checkbox', context).attr('checked', 'checked');
        $('select[multiple] option, option[value="create_civicrm_webform_element"]', context).each(function() {
          $(this).attr('selected', 'selected');
        });
        break;
      case 'none':
        $('input:checkbox', context).attr('checked', '');
        $('select:not([multiple])', context).each(function() {
          if ($(this).val() === 'create_civicrm_webform_element') {
            $('option', this).each(function() {
              $(this).attr('selected', $(this).attr('defaultSelected'));
            });
          }
          if ($(this).val() === 'create_civicrm_webform_element') {
            $('option:first-child+option', this).attr('selected', 'selected');
          }
        });
        $('select[multiple] option', context).each(function() {
          $(this).attr('selected', '');
        });
        break;
      case 'reset':
        $('input:checkbox', context).each(function() {
          $(this).attr('checked', $(this).attr('defaultChecked'));
        });
        $('select option', context).each(function() {
          $(this).attr('selected', $(this).attr('defaultSelected'));
        });
        break;
    }
    $('select', context).change();
  }

  pub.participantConditional = function (fs) {
    var info = {
      roleid:$(fs + ' .participant_role_id').val(),
      eventid:'0',
      eventtype:$('#edit-reg-options-event-type').val()
    };
    var events = [];
    var i = 0;
    $(fs + ' .participant_event_id :selected').each(function(a, selected) {
      if ($(selected).val() !== 'create_civicrm_webform_element') {
        events[i++] = $(selected).val();
      }
    });
    for (i in events) {
      var splitstr = events[i].split('-');
      if (events.length === 1) {
        info['eventid'] = splitstr[0];
      }
      if (i == 0) {
        info['eventtype'] = splitstr[1];
      }
      else if (info['eventtype'] !== splitstr[1]) {
        info['eventtype'] = '0';
      }
    }

    $(fs + ' fieldset.extends-condition').each(function() {
      var hide = true;
      var classes = $(this).attr('class').split(' ');
      for (var cl in classes) {
        var c = classes[cl].split('-');
        var type = c[0];
        if (type === 'roleid' || type === 'eventtype' || type === 'eventid') {
          for (var cid in c) {
            if (c[cid] === info[type]) {
              hide = false;
            }
          }
          break;
        }
      }
      if (hide) {
        $(this).find(':checkbox').attr('disabled', 'disabled');
        $(this).hide(300);
      }
      else {
        $(this).find(':checkbox').removeAttr('disabled');
        $(this).show(300);
      }
    });
  }

  /**
   * Private methods.
   */

  function relationshipOptions() {
    var contacts = $('#edit-number-of-contacts').val();
    if (contacts > 1) {
      var types = {};
      for (var c=1; c<=contacts; c++) {
        var sub_type = [];
        $('#edit-civicrm-'+c+'-contact-1-contact-contact-sub-type :selected').each(function(i, selected) {
          if ($(selected).val() !== 'create_civicrm_webform_element') {
            sub_type[i] = $(selected).val();
          }
        });
        types[c] = {
              type: $('#edit-'+c+'-contact-type').val(),
          sub_type: sub_type,
        };
      }
      $('select[id$=relationship-relationship-type-id]').each(function() {
        var selected_option = $(this).val();
        var id = $(this).attr('id').split('-');
        var contact_a = types[id[2]];
        var contact_b = types[id[4]];
        $('option', this).not('[value="0"],[value="create_civicrm_webform_element"]').remove();
        for (var i in webform_civicrm_relationship_data) {
          var t = webform_civicrm_relationship_data[i];
          if ( (t['type_a'] == contact_a['type'] || !t['type_a'])
            && (t['type_b'] == contact_b['type'] || !t['type_b'])
            && ($.inArray(t['sub_type_a'], contact_a['sub_type']) > -1 || !t['sub_type_a'])
            && ($.inArray(t['sub_type_b'], contact_b['sub_type']) > -1 || !t['sub_type_b'])
          ) {
            $(this).append('<option value="'+t['id']+'_a">'+t['label_a_b']+'</option>');
          }
          if ( (t['type_a'] == contact_b['type'] || !t['type_a'])
            && (t['type_b'] == contact_a['type'] || !t['type_b'])
            && ($.inArray(t['sub_type_a'], contact_b['sub_type']) > -1 || !t['sub_type_a'])
            && ($.inArray(t['sub_type_b'], contact_a['sub_type']) > -1 || !t['sub_type_b'])
            && (t['name_a_b'] !== t['name_b_a'])
          ) {
            $(this).append('<option value="'+t['id']+'_b">'+t['label_b_a']+'</option>');
          }
        }
        if ($(this).find('option[value='+selected_option+']').size()) {
          $(this).val(selected_option);
        }
        else {
          $(this).val("0");
        }
      });
    }
  }

  function ContactMatchCheckbox() {
    if($('#edit-1-contact-type').val() == 'individual') {
      $('#civi-contact-match-on').show();
      $('#civi-contact-match-off').hide();
    }
    else {
      $('#civi-contact-match-on').hide();
      $('#civi-contact-match-off').show();
    }
  }

  function CheckLength(str) {
    str = D.checkPlain(str);
    if (str.length > 45) {
      str = str.substr(0, 43) + '...';
    }
    return str;
  }

  /**
   * Add Drupal behaviors.
   */

  D.behaviors.webform_civicrmAdmin = {
    attach: function (context) {
      // Summaries for vertical tabs
      $('fieldset[id^="edit-contact-"]', context).once('wf-civi').drupalSetSummary(function (context) {
        var label = $('select[name$="_contact_type"] option:selected', context).text();
        if ($('select[name$="_contact_sub_type[]"]', context).val()) {
          var first = true;
          $('select[name$="_contact_sub_type[]"] option:selected', context).each(function() {
            label += (first ? ' (' : ', ') + $.trim($(this).text());
            first = false;
          });
          label += ')';
        }
        return label;
      });
      $('fieldset#edit-st-message', context).once('wf-civi').drupalSetSummary(function (context) {
        if ($('[name="toggle_message"]', context).attr('checked')) {
          return CheckLength($('#edit-message', context).val());
        }
        else {
          return D.t('- None -');
        }
      });
      $('fieldset#edit-prefix', context).once('wf-civi').drupalSetSummary(function (context) {
        var label = $('[name="prefix_known"]', context).val();
        if (!(label.length > 0)) {
          label = $('[name="prefix_unknown"]', context).val();
        }
        if (label.length > 0) {
          return CheckLength(label);
        }
        else {
          return D.t('- None -');
        }
      });
      $('fieldset#edit-event', context).once('wf-civi').drupalSetSummary(function (context) {
        return $('select[name="participant_reg_type"] option:selected', context).text();
      });
      $('fieldset#edit-act', context).once('wf-civi').drupalSetSummary(function (context) {
        var label = $('select[name="activity_type_id"] option:selected', context).text();
        if ($('select[name="case_type_id"] option:selected', context).val() > 0) {
          label = $('select[name="case_type_id"] option:selected', context).text() + ' ' + label;
        }
        return label;
      });
      $('fieldset#edit-options', context).once('wf-civi').drupalSetSummary(function (context) {
        var label = '';
        $(':checked', context).each(function() {
          label = (label ? label + ', ' : '') + $.trim($(this).siblings('label').text());
        });
        return label;
      });

      ContactMatchCheckbox();

      $('#edit-nid', context).once('wf-civi').change(function() {
        if ($(this).is(':checked')) {
          $('#webform-civicrm-configure-form .vertical-tabs, .form-item-number-of-contacts').removeAttr('style');
          $('#webform-civicrm-configure-form .vertical-tabs-panes').removeClass('hidden');
          $('[name="number_of_contacts"]').removeAttr('disabled');
        }
        else {
          $('#webform-civicrm-configure-form .vertical-tabs, .form-item-number-of-contacts').css('opacity', '0.4');
          $('#webform-civicrm-configure-form .vertical-tabs-panes').addClass('hidden');
          $('[name="number_of_contacts"]').attr('disabled','disabled');
        }
      }).change();

      $('#edit-toggle-message', context).once('wf-civi').change(function() {
        if($(this).is(':checked')) {
          $('#edit-message').removeAttr('disabled');
        }
        else {
          $('#edit-message').attr('disabled','disabled');
        }
      }).change();

      $('select[id*=contact-type], select[id*=contact-sub-type]', context).once('wf-civi').change(function() {
        relationshipOptions();
      });

      $('select[id$=address-master-id]', context).change();

      $('#edit-number-of-contacts', context).once('wf-civi').change(function() {
        $('#webform-civicrm-configure-form')[0].submit();
      });

      $('#edit-1-contact-type', context).once('wf-civi').change(function() {
        ContactMatchCheckbox();
      });

      $('select[name*="address_master_id"]', context).once('wf-civi').change(function() {
        var ele = $(this);
        var fs = ele.parent().parent();
        switch (ele.val()) {
          case 'create_civicrm_webform_element':
          case '0':
            $('input:checkbox', fs).removeAttr('disabled');
            $('div.form-type-checkbox', fs).show();
            break;
          default:
            $('input:checkbox', fs).attr('disabled', 'disabled');
            $('div.form-type-checkbox', fs).hide();
        }
      }).change();
    }
  };

  return pub;
})(jQuery, Drupal);
