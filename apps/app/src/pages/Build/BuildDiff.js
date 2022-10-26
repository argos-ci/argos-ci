/* eslint-disable react/no-unescaped-entities */
import * as React from "react";
import { x } from "@xstyled/styled-components";
import moment from "moment";
import {
  IconButton,
  InlineCode,
  BaseLink,
  Alert,
} from "@argos-ci/app/src/components";
import { ArrowUpIcon, ArrowDownIcon, EyeIcon } from "@heroicons/react/24/solid";

const BranchInfo = ({ bucket, baseline, ...props }) => {
  return (
    <x.div
      color="secondary-text"
      textAlign="center"
      w={1}
      fontWeight="medium"
      fontSize="xs"
      lineHeight={3}
      mb={4}
      {...props}
    >
      {bucket ? (
        <>
          {baseline ? "Baseline" : "Changes"} from{" "}
          <InlineCode mx={1}>{bucket.branch}</InlineCode>
          <x.div fontSize={11} mt={0.5} fontWeight="normal">
            {moment(bucket.createdAt).fromNow()}
          </x.div>
        </>
      ) : (
        "No baseline to compare"
      )}
    </x.div>
  );
};

const DiffHeader = React.forwardRef(
  ({ activeDiff, setShowChanges, showChanges }, ref) => (
    <x.div
      ref={ref}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={4}
    >
      <x.div display="flex" alignItems="center">
        <IconButton icon={ArrowUpIcon} />
        <IconButton icon={ArrowDownIcon} />
        <x.div ml={3} fontSize="sm" fontWeight="medium" lineHeight={1.2}>
          {activeDiff.compareScreenshot?.name ||
            activeDiff.baseScreenshot?.name}
        </x.div>
      </x.div>

      <x.div display="flex" alignItems="center">
        <IconButton
          icon={EyeIcon}
          color="danger"
          onClick={() => setShowChanges((prev) => !prev)}
          toggle={showChanges}
        />
      </x.div>
    </x.div>
  )
);

const FullWidthImage = (props) => (
  <x.img w={1} objectFit="contain" mb={8} {...props} />
);

const Baseline = ({ activeDiff }) => {
  return activeDiff.baseScreenshot?.url ? (
    <BaseLink href={activeDiff.baseScreenshot.url} target="_blank">
      <FullWidthImage
        src={activeDiff.baseScreenshot.url}
        alt={activeDiff.baseScreenshot.name}
      />
    </BaseLink>
  ) : (
    <Alert color="info">
      No compare baseline for {activeDiff.status} screenshot.
    </Alert>
  );
};

const Changes = ({ activeDiff, showChanges }) => {
  return activeDiff.compareScreenshot?.url && activeDiff.status !== "stable" ? (
    <BaseLink
      href={activeDiff.compareScreenshot?.url}
      target="_blank"
      position="relative"
      display="inline-block" // fix Firefox bug on "position: relative"
    >
      {showChanges && activeDiff.url ? (
        <FullWidthImage
          src={activeDiff.url}
          position="absolute"
          backgroundColor="rgba(255, 255, 255, 0.8)"
        />
      ) : null}
      <FullWidthImage
        alt={activeDiff.compareScreenshot.name}
        src={activeDiff.compareScreenshot.url}
      />
    </BaseLink>
  ) : (
    <Alert color="info">No change for {activeDiff.status} screenshot.</Alert>
  );
};

export function BuildDiff({
  build,
  activeDiffId,
  showChanges,
  setShowChanges,
}) {
  const {
    baseScreenshotBucket,
    compareScreenshotBucket,
    screenshotDiffs: { edges: screenshotDiffs },
  } = build;

  const activeDiff =
    screenshotDiffs.find(({ id }) => id === activeDiffId) || screenshotDiffs[0];

  const headerRef = React.useRef();
  const [headerRect, setHeaderRect] = React.useState(null);
  React.useLayoutEffect(() => {
    setHeaderRect(headerRef.current?.getBoundingClientRect());
  }, []);

  return (
    <x.div flex="1 1 auto">
      <DiffHeader
        ref={headerRef}
        activeDiff={activeDiff}
        setShowChanges={setShowChanges}
        showChanges={showChanges}
      />

      <x.div
        display="flex"
        justifyContent="space-between"
        gap={6}
        h={`calc(100vh - ${headerRect?.top + headerRect?.height || 0}px)`}
        overflowY="auto"
        pt={2}
        px={4}
      >
        <x.div display="flex" flex={1} flexDirection="column">
          <BranchInfo bucket={baseScreenshotBucket} baseline />
          <Baseline
            activeDiff={activeDiff}
            baseScreenshotBucket={baseScreenshotBucket}
          />
        </x.div>
        <x.div display="flex" flex={1} flexDirection="column">
          <BranchInfo bucket={compareScreenshotBucket} />
          <Changes
            activeDiff={activeDiff}
            showChanges={showChanges}
            compareScreenshotBucket={compareScreenshotBucket}
          />
        </x.div>
      </x.div>
    </x.div>
  );
}
