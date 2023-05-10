import { Transition } from "@headlessui/react";
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  MegaphoneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";

import useNotification from "./useNotification";
import clsx from "clsx";

export const Notification = () => {
  const { variant, title } = useNotification();

  const [show, setShow] = useState(true);

  const variants = {
    success: "bg-green-500",
    info: "bg-yellow-500",
    error: "bg-red-500",
  };

  const variantIcon = () => {
    switch (variant) {
      case "success":
        return (
          <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
        );
      case "info":
        return (
          <InformationCircleIcon
            className="h-5 w-5 text-white"
            aria-hidden="true"
          />
        );
      case "error":
        return (
          <ExclamationCircleIcon
            className="h-5 w-5 text-white"
            aria-hidden="true"
          />
        );
      default:
        return (
          <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
        );
    }
  };

  useEffect(() => {
    setShow(true);
  }, [variant, title]);

  if (variant && title && show) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-10 pb-8 pt-0 sm:pb-0 sm:top-0 sm:pt-6 z-30">
        <div className="mx-auto max-w-sm px-2 sm:px-6 lg:px-8">
          <Transition
            show={show}
            as={Fragment}
            enter="transform ease-out duration-500 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={clsx(
                variants[variant],
                "rounded-lg px-2 py-1 shadow-lg"
              )}
            >
              <div className="flex flex-wrap items-center justify-between">
                <div className="flex w-0 flex-1 items-center">
                  <span className="flex rounded-lg p-2">{variantIcon()}</span>
                  <p className="ml-3 truncate font-medium text-white text-sm">
                    <span>{title}</span>
                  </p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};
