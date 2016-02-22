(function() {
  'use strict';

  angular.module('app.components')
    .component('dynamicTabs', {
      bindings: {
        tabList: '='
      },
      controller: function(DialogEdit, lodash) {
        /**
         * After loading component, activate first tab if there is any
         * and store current data in service
         *
         * Parameter: DialogEdit -- service containing data
         */
        this.$onInit = function() {
          if (this.tabList.length !== 0) {
            DialogEdit.activeTab = 0;
            this.tabList[0].active = true;
          }
          DialogEdit.setData(this.tabList);
        }

        /**
         * Update tabs position values
         *
         * Parameter: tabs -- array of tabs to sort
         */
        function updatePosition(tabs) {
          for (var i = 0; i < tabs.length; i++) {
            tabs[i].position = i;
          }
        }

        this.sortableOptions = {
          stop: function(e, ui) {
            updatePosition(ui.item.scope().$parent.dynamicTabs.tabList);
            // update active tab position if active tab was sorted
            if (ui.item.scope().tab.active) {
              // active tab was sorted
              DialogEdit.activeTab = ui.item.scope().$index;
            } else if (false) {
              // FIXME: inactive tab was sorted on position of active tab
              // (active tab is on position +1 from inactive)
              // FIXME: [inactive+filled] [active]
              // active got closed => new active is empty instead of filled
            }
          },
          cancel: '.nosort',
          axis: 'x',
          cursor: 'move',
          revert: 50,
        };

        /**
         * Add a new tab to tab list
         * New tab automaticaly does have last position in list
         * and is set as active
         */
        this.addTab = function() {
          // make sure all current tabs are deactivated
          this.tabList.forEach(function(tab) {
            tab.active = false;
          });
          // create a new tab
          var nextIndex = this.tabList.length;
          this.tabList.push({
            description: __('New tab ') + nextIndex,
            display: "edit",
            label: __('New tab ') + nextIndex,
            position: nextIndex,
            active: true,
            dialog_groups: []
          });
          // set activity for a new tab
          DialogEdit.activeTab = nextIndex;
          DialogEdit.setData(this.tabList);
        };

        /**
         * Delete tab by its position.
         * After removing tab it's necessary to update
         * position informations for tabs
         *
         * If tab is active in the moment of deletion,
         * activity goes to first tab
         */
        this.deleteTab = function(id) {
          // if active, deactivate first
          if (this.tabList[id].active) {
            var firstInactiveTab = lodash.find(this.tabList, {active: false});
            if (firstInactiveTab !== undefined) {
              firstInactiveTab.active = true;
            }
          }
          // remove tab with matching id
          lodash.remove(this.tabList, function(tab) {
            return tab.position === id;
          });
          updatePosition(this.tabList);
        };

        /**
         * Select active tab by parameter representing index
         */
        this.selectTab = function(id) {
          var deselectedTab = lodash.find(this.tabList, {active: true});
          deselectedTab.active = false;
          var selectedTab = this.tabList[id];
          selectedTab.active = true;
        };
      },
      controllerAs: 'dynamicTabs',
      templateUrl: 'app/components/dynamic-tabs/dynamic-tabs.html',
    });
})();
