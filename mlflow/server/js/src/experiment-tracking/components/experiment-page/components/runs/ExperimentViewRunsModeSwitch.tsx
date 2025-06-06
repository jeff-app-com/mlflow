import {
  Button,
  Popover,
  LegacyTabs,
  Tag,
  LegacyTooltip,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import React, { useState, useEffect, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { ExperimentPageViewState } from '../../models/ExperimentPageViewState';
import { useExperimentViewLocalStore } from '../../hooks/useExperimentViewLocalStore';
import type { ExperimentViewRunsCompareMode } from '../../../../types';
import { PreviewBadge } from '@mlflow/mlflow/src/shared/building_blocks/PreviewBadge';
import { FeatureBadge } from '@mlflow/mlflow/src/shared/building_blocks/FeatureBadge';
import { getExperimentPageDefaultViewMode, useExperimentPageViewMode } from '../../hooks/useExperimentPageViewMode';
import {
  isExperimentEvalResultsMonitoringUIEnabled,
  isExperimentLoggedModelsUIEnabled,
  shouldEnableTracingUI,
} from '../../../../../common/utils/FeatureUtils';
import { MONITORING_BETA_EXPIRATION_DATE } from '../../../../constants';
import { useShouldShowCombinedRunsTab } from '../../hooks/useShouldShowCombinedRunsTab';
import { useExperimentPageSearchFacets } from '../../hooks/useExperimentPageSearchFacets';

const COMPARE_RUNS_TOOLTIP_STORAGE_KEY = 'compareRunsTooltip';
const COMPARE_RUNS_TOOLTIP_STORAGE_ITEM = 'seenBefore';

export interface ExperimentViewRunsModeSwitchProps {
  viewState?: ExperimentPageViewState;
  runsAreGrouped?: boolean;
  hideBorder?: boolean;
  explicitViewMode?: ExperimentViewRunsCompareMode;
  experimentId?: string;
}

const ChartViewButtonTooltip: React.FC<{
  isTableMode: boolean;
  multipleRunsSelected: boolean;
}> = ({ multipleRunsSelected, isTableMode }) => {
  const seenTooltipStore = useExperimentViewLocalStore(COMPARE_RUNS_TOOLTIP_STORAGE_KEY);
  const [isToolTipOpen, setToolTipOpen] = useState(
    multipleRunsSelected && !seenTooltipStore.getItem(COMPARE_RUNS_TOOLTIP_STORAGE_ITEM),
  );

  useEffect(() => {
    const hasSeenTooltipBefore = seenTooltipStore.getItem(COMPARE_RUNS_TOOLTIP_STORAGE_ITEM);
    if (multipleRunsSelected && isTableMode && !hasSeenTooltipBefore) {
      setToolTipOpen(true);
    } else {
      setToolTipOpen(false);
    }
  }, [multipleRunsSelected, isTableMode, seenTooltipStore]);

  const updateIsTooltipOpen = useCallback(
    (isOpen) => {
      setToolTipOpen(isOpen);
      seenTooltipStore.setItem(COMPARE_RUNS_TOOLTIP_STORAGE_ITEM, true);
    },
    [setToolTipOpen, seenTooltipStore],
  );

  return (
    <>
      <Popover.Root
        componentId="codegen_mlflow_app_src_experiment-tracking_components_experiment-page_components_runs_experimentviewrunsmodeswitch.tsx_60"
        open={isToolTipOpen}
      >
        <Popover.Trigger asChild>
          <div css={{ position: 'absolute', inset: 0 }} />
        </Popover.Trigger>
        <Popover.Content align="start">
          <div css={{ maxWidth: '200px' }}>
            <Typography.Paragraph>
              <FormattedMessage
                defaultMessage="You can now switch to the chart view to compare runs"
                description="Tooltip to push users to use the chart view instead of compare view"
              />
            </Typography.Paragraph>
            <div css={{ textAlign: 'right' }}>
              <Button
                componentId="codegen_mlflow_app_src_experiment-tracking_components_experiment-page_components_runs_experimentviewrunsmodeswitch.tsx_65"
                onClick={() => updateIsTooltipOpen(false)}
                type="primary"
              >
                <FormattedMessage defaultMessage="Got it" description="Button action text for chart switcher tooltip" />
              </Button>
            </div>
          </div>
          <Popover.Arrow />
        </Popover.Content>
      </Popover.Root>
    </>
  );
};

/**
 * Allows switching between various modes of the experiment page view.
 * Handles legacy part of the mode switching, based on "compareRunsMode" query parameter.
 * Modern part of the mode switching is handled by <ExperimentViewRunsModeSwitchV2> which works using route params.
 */
export const ExperimentViewRunsModeSwitch = ({
  viewState,
  runsAreGrouped,
  hideBorder = true,
}: ExperimentViewRunsModeSwitchProps) => {
  const [, experimentIds] = useExperimentPageSearchFacets();
  const [viewMode, setViewModeInURL] = useExperimentPageViewMode();
  const { classNamePrefix, theme } = useDesignSystemTheme();
  const currentViewMode = viewMode || getExperimentPageDefaultViewMode();
  const showCombinedRuns = useShouldShowCombinedRunsTab();
  const activeTab = showCombinedRuns && ['TABLE', 'CHART'].includes(currentViewMode) ? 'RUNS' : currentViewMode;

  // Extract experiment ID from the URL but only if it's a single experiment.
  // In case of multiple experiments (compare mode), the experiment ID is undefined.
  const singleExperimentId = experimentIds.length === 1 ? experimentIds[0] : undefined;

  return (
    <LegacyTabs
      dangerouslyAppendEmotionCSS={{
        [`.${classNamePrefix}-tabs-nav`]: {
          marginBottom: 0,
          '::before': {
            display: hideBorder ? 'none' : 'block',
          },
        },
      }}
      activeKey={activeTab}
      onChange={(tabKey) => {
        const newValue = tabKey as ExperimentViewRunsCompareMode | 'RUNS';

        if (activeTab === newValue) {
          return;
        }

        if (newValue === 'RUNS') {
          return setViewModeInURL('TABLE');
        }

        setViewModeInURL(newValue, singleExperimentId);
      }}
    >
      {/* Display the "Models" tab if we have only one experiment and the feature is enabled. */}
      {singleExperimentId && isExperimentLoggedModelsUIEnabled() && (
        <LegacyTabs.TabPane
          key="MODELS"
          tab={
            <span data-testid="experiment-runs-mode-switch-models">
              <FormattedMessage
                defaultMessage="Models"
                description="A button navigating to logged models table on the experiment page"
              />
              <PreviewBadge />
            </span>
          }
        />
      )}
      {showCombinedRuns ? (
        <LegacyTabs.TabPane
          tab={
            <span data-testid="experiment-runs-mode-switch-combined">
              <FormattedMessage
                defaultMessage="Runs"
                description="A button enabling combined runs table and charts mode on the experiment page"
              />
            </span>
          }
          key="RUNS"
        />
      ) : (
        <>
          <LegacyTabs.TabPane
            tab={
              <span data-testid="experiment-runs-mode-switch-list">
                <FormattedMessage
                  defaultMessage="Table"
                  description="A button enabling table mode on the experiment page"
                />
              </span>
            }
            key="TABLE"
          />
          <LegacyTabs.TabPane
            tab={
              <>
                <span data-testid="experiment-runs-mode-switch-compare">
                  <FormattedMessage
                    defaultMessage="Chart"
                    description="A button enabling compare runs (chart) mode on the experiment page"
                  />
                </span>
                <ChartViewButtonTooltip
                  isTableMode={viewMode === 'TABLE'}
                  multipleRunsSelected={viewState ? Object.keys(viewState.runsSelected).length > 1 : false}
                />
              </>
            }
            key="CHART"
          />
        </>
      )}

      <LegacyTabs.TabPane
        disabled={runsAreGrouped}
        tab={
          <LegacyTooltip
            title={
              runsAreGrouped ? (
                <FormattedMessage
                  defaultMessage="Unavailable when runs are grouped"
                  description="Experiment page > view mode switch > evaluation mode disabled tooltip"
                />
              ) : undefined
            }
          >
            <span data-testid="experiment-runs-mode-switch-evaluation">
              <FormattedMessage
                defaultMessage="Evaluation"
                description="A button enabling compare runs (evaluation) mode on the experiment page"
              />
              <PreviewBadge />
            </span>
          </LegacyTooltip>
        }
        key="ARTIFACT"
      />
      {singleExperimentId && isExperimentEvalResultsMonitoringUIEnabled() && (
        <LegacyTabs.TabPane
          tab={
            <span data-testid="experiment-runs-mode-evaluation-results">
              <FormattedMessage
                defaultMessage="Monitoring"
                description="A button enabling evaluation results monitoring mode on the experiment page"
              />
              <FeatureBadge type="beta" expirationDate={MONITORING_BETA_EXPIRATION_DATE} />
            </span>
          }
          key="EVAL_RESULTS"
        />
      )}
      {shouldEnableTracingUI() && (
        <LegacyTabs.TabPane
          tab={
            <span data-testid="experiment-runs-mode-switch-traces">
              <FormattedMessage
                defaultMessage="Traces"
                description="A button enabling traces mode on the experiment page"
              />
            </span>
          }
          key="TRACES"
        />
      )}
    </LegacyTabs>
  );
};
